// Centralized local mock-data service. Every create / edit / delete / status change goes
// through here so the dashboard, lists, details and activity feed stay in sync.
// In-memory on purpose (each launch starts fresh). Swap the bodies for API calls later.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ROLES } from "@/src/config/roles";
import { BRAND, VOICES, VOICE_SEED } from "@/src/config/studio";
import { ACTIVITY, BRAND_SEED, CAMPAIGNS, DRAFTS, FAVORITES, LIBRARY, PEOPLE, REVIEWS, SCHEDULED, TASKS, TEAM } from "@/src/data/mock";
import type { ActivityItem, Asset, BrandSettings, BrandVoice, Campaign, Draft, DraftInput, DraftStatus, Person, PostInput, PublishStatus, Review, RoleId, ScheduledPost, Task, TaskStatus } from "@/src/types";

export interface Db {
  campaigns: Campaign[];
  tasks: Task[];
  activity: ActivityItem[];
  scheduled: ScheduledPost[];
  drafts: Draft[];
  /** assets not tied to a campaign */
  library: Asset[];
  favorites: string[];
  reviews: Review[];
  people: Record<string, Person>;
  voices: BrandVoice[];
  brand: BrandSettings;
}

export type MemberInput = Pick<Person, "name" | "email" | "role" | "title">;

export type CampaignInput = Pick<Campaign, "name" | "desc" | "status" | "start" | "end" | "visibility" | "team" | "channels">;
export type TaskInput = Pick<Task, "title" | "description" | "cid" | "module" | "assignee" | "due" | "priority" | "status" | "channels">;

const seed = (): Db => ({
  campaigns: CAMPAIGNS.map((c) => ({ ...c, team: [...c.team], members: [...c.members], channels: [...c.channels], assets: [...c.assets] })),
  tasks: TASKS.map((t) => ({ ...t, channels: [...t.channels] })),
  activity: [...ACTIVITY],
  scheduled: [...SCHEDULED],
  drafts: DRAFTS.map((d) => ({ ...d })),
  library: LIBRARY.map((a) => ({ ...a })),
  favorites: [...FAVORITES],
  reviews: [...REVIEWS],
  people: Object.fromEntries(TEAM.map((p) => [p.id, { ...p }])),
  voices: VOICE_SEED.map((v) => ({ ...v })),
  brand: { ...BRAND_SEED, colors: [...BRAND_SEED.colors] },
});

/** Keep the shared lookups (people, voices, brand prefs) in step with the store. */
function syncRegistries(d: Db) {
  Object.keys(PEOPLE).forEach((k) => delete PEOPLE[k]);
  Object.assign(PEOPLE, d.people);
  VOICES.splice(0, VOICES.length, ...d.voices);
  Object.assign(BRAND, d.brand);
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

const POST_ACTION: Record<PublishStatus, string> = {
  Scheduled: "Resumed a scheduled post",
  Publishing: "Started publishing a post",
  Published: "Published a post (demo)",
  Failed: "A post failed to publish",
  Paused: "Paused a scheduled post",
};

let counter = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(counter++).toString(36)}`;
const roleOf = (personId: string): RoleId | undefined => PEOPLE[personId]?.role;

/** Activity is visible to managers, the actor, and anyone involved. */
function entry(actor: RoleId, action: string, detail: string, people: string[] = []): ActivityItem {
  const roles = new Set<RoleId>(["super_admin", "admin", actor]);
  people.forEach((p) => {
    const r = roleOf(p);
    if (r) roles.add(r);
  });
  return { id: uid("ac"), actor: ROLES[actor].personId, action, detail, at: "Just now", roles: [...roles] };
}

const STATUS_ACTION: Record<TaskStatus, string> = {
  "To do": "Reopened a task",
  "In progress": "Started a task",
  "In review": "Submitted work for approval",
  "Changes requested": "Requested changes",
  Approved: "Approved work",
  "Ready to publish": "Marked ready to publish",
  Completed: "Completed a task",
};

function addToTeam(campaigns: Campaign[], cid: string, personId: string): Campaign[] {
  return campaigns.map((c) =>
    c.id === cid && !c.team.includes(personId)
      ? { ...c, team: [...c.team, personId], members: c.visibility === "private" ? [...new Set([...c.members, personId])] : c.members }
      : c,
  );
}

function assetFrom(task: Task): Asset | null {
  if (task.module === "Library" || task.module === "Branding") return null;
  return { id: uid("as"), name: task.title, kind: task.module === "Ad Studio" ? "image" : "doc", addedBy: task.assignee, from: task.id };
}

const TASK_TO_DRAFT: Partial<Record<TaskStatus, DraftStatus>> = { "To do": "Draft", "In progress": "Draft", "In review": "In review", "Changes requested": "Changes requested", Approved: "Approved" };
const DRAFT_TO_TASK: Partial<Record<DraftStatus, TaskStatus>> = { Draft: "In progress", "In review": "In review", "Changes requested": "Changes requested", Approved: "Approved" };
const DRAFT_ACTION: Record<DraftStatus, string> = { Draft: "Moved a draft back to editing", "In review": "Submitted work for approval", "Changes requested": "Requested changes", Approved: "Approved work" };
const draftAssetKind = (d: Draft): Asset["kind"] => (d.type === "imagead" ? "image" : d.type === "videoad" ? "video" : d.type === "post" ? "post" : "doc");

const REVIEW_ACTION: Partial<Record<TaskStatus | DraftStatus, Review["action"]>> = { "In review": "submitted", Approved: "approved", "Changes requested": "rejected" };
let reviewOrder = 100;
/** Append an entry to the review history for submissions and decisions. */
function withReview(d: Db, kind: Review["kind"], itemId: string, status: TaskStatus | DraftStatus, by: RoleId, note: string): Db {
  const action = REVIEW_ACTION[status];
  if (!action) return d;
  return { ...d, reviews: [...d.reviews, { id: uid("r"), kind, itemId, action, by: ROLES[by].personId, note, at: "Just now", order: reviewOrder++ }] };
}

/** When tasks are deleted, their review history moves to the linked draft (if any). */
function moveReviews(d: Db, taskIds: string[]): Review[] {
  return d.reviews.map((r) => {
    if (r.kind !== "task" || !taskIds.includes(r.itemId)) return r;
    const dr = d.drafts.find((x) => x.taskId === r.itemId);
    return dr ? { ...r, kind: "draft" as const, itemId: dr.id } : r;
  });
}

/** Remove an asset wherever it lives; returns the asset and the db without it. */
function takeAsset(d: Db, id: string): [Asset | undefined, Db] {
  const lib = d.library.find((a) => a.id === id);
  if (lib) return [lib, { ...d, library: d.library.filter((a) => a.id !== id) }];
  let found: Asset | undefined;
  const campaigns = d.campaigns.map((c) => {
    const a = c.assets.find((x) => x.id === id);
    if (!a) return c;
    found = a;
    return { ...c, assets: c.assets.filter((x) => x.id !== id) };
  });
  return [found, { ...d, campaigns }];
}

/** Pure task status transition shared by tasks and linked drafts. */
function applyTaskStatus(d: Db, id: string, status: TaskStatus, by: RoleId, note = ""): Db {
  const t = d.tasks.find((x) => x.id === id);
  if (!t) return d;
  const next: Task = { ...t, status, updatedAt: Date.now(), submittedAt: status === "In review" ? "Just now" : t.submittedAt };
  let campaigns = d.campaigns;
  // Approved / completed work lands in the campaign's assets.
  if (status === "Approved" || status === "Completed") {
    campaigns = campaigns.map((c) => {
      if (c.id !== t.cid || c.assets.some((a) => a.from === t.id)) return c;
      const asset = assetFrom(t);
      return asset ? { ...c, assets: [asset, ...c.assets] } : c;
    });
  }
  const ds = TASK_TO_DRAFT[status];
  const drafts = ds ? d.drafts.map((x) => (x.taskId === id ? { ...x, status: ds, updatedAt: Date.now() } : x)) : d.drafts;
  const action = status === "Completed" && t.module === "Library" ? "Published a post" : STATUS_ACTION[status];
  // Completing a publishing task sends its scheduled post live (and reopening un-publishes nothing).
  const scheduled = status === "Completed" ? d.scheduled.map((s) => (s.taskId === id && s.status !== "Published" ? { ...s, status: "Published" as const, note: "" } : s)) : d.scheduled;
  return withReview({ ...d, scheduled, campaigns, drafts, tasks: d.tasks.map((x) => (x.id === id ? next : x)), activity: [entry(by, action, t.title, [t.assignee]), ...d.activity] }, "task", id, status, by, note);
}

interface Store {
  db: Db;
  saveDraft: (input: DraftInput, by: RoleId, id?: string | null) => string;
  setDraftStatus: (id: string, status: DraftStatus, by: RoleId, note?: string) => void;
  addAsset: (input: Pick<Asset, "name" | "kind" | "uri">, by: RoleId) => string;
  renameAsset: (id: string, name: string) => void;
  moveAsset: (id: string, cid: string | null, by: RoleId) => void;
  deleteAsset: (id: string, by: RoleId) => void;
  toggleFavorite: (id: string) => void;
  deleteDraft: (id: string, by: RoleId) => void;
  createCampaign: (input: CampaignInput, by: RoleId) => string;
  updateCampaign: (id: string, input: CampaignInput, by: RoleId) => void;
  deleteCampaign: (id: string, by: RoleId) => void;
  createTask: (input: TaskInput, by: RoleId) => string;
  updateTask: (id: string, patch: Partial<TaskInput>, by: RoleId, action?: string) => void;
  setTaskStatus: (id: string, status: TaskStatus, by: RoleId, note?: string) => void;
  deleteTask: (id: string, by: RoleId) => void;
  savePost: (input: PostInput, by: RoleId, id?: string | null) => string;
  setPostStatus: (id: string, status: PublishStatus, by: RoleId, note?: string) => void;
  deletePost: (id: string, by: RoleId) => void;
  inviteMember: (input: MemberInput, by: RoleId) => string;
  updateMember: (id: string, patch: Partial<Person>, by: RoleId, action?: string) => void;
  removeMember: (id: string, by: RoleId) => void;
  updateBrand: (patch: Partial<BrandSettings>, by: RoleId) => void;
  saveVoice: (voice: Omit<BrandVoice, "id">, by: RoleId, id?: string | null) => string;
  deleteVoice: (id: string, by: RoleId) => void;
  resetData: () => void;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(seed);

  const createCampaign = useCallback((input: CampaignInput, by: RoleId) => {
    const id = uid("c");
    const owner = ROLES[by].personId;
    const team = input.team.includes(owner) ? input.team : [owner, ...input.team];
    setDb((d) => ({
      ...d,
      campaigns: [{ ...input, id, owner, team, members: input.visibility === "private" ? team : [], assets: [] }, ...d.campaigns],
      activity: [entry(by, "Created a campaign", input.name, team), ...d.activity],
    }));
    return id;
  }, []);

  const updateCampaign = useCallback((id: string, input: CampaignInput, by: RoleId) => {
    setDb((d) => ({
      ...d,
      campaigns: d.campaigns.map((c) =>
        c.id === id ? { ...c, ...input, members: input.visibility === "private" ? [...new Set([...c.members, ...input.team])] : c.members } : c,
      ),
      activity: [entry(by, "Updated a campaign", input.name, input.team), ...d.activity],
    }));
  }, []);

  const deleteCampaign = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const c = d.campaigns.find((x) => x.id === id);
      if (!c) return d;
      return {
        ...d,
        campaigns: d.campaigns.filter((x) => x.id !== id),
        tasks: d.tasks.filter((t) => t.cid !== id),
        // Drafts survive as unlinked drafts so pending approvals are never lost.
        drafts: d.drafts.map((x) => (x.cid === id ? { ...x, cid: null, taskId: null } : x)),
        reviews: moveReviews(d, d.tasks.filter((t) => t.cid === id).map((t) => t.id)),
        scheduled: d.scheduled.filter((s) => s.cid !== id),
        activity: [entry(by, "Deleted a campaign", c.name, c.team), ...d.activity],
      };
    });
  }, []);

  const createTask = useCallback((input: TaskInput, by: RoleId) => {
    const id = uid("t");
    setDb((d) => ({
      ...d,
      tasks: [{ ...input, id, updatedAt: Date.now(), submittedAt: input.status === "In review" ? "Just now" : undefined }, ...d.tasks],
      campaigns: addToTeam(d.campaigns, input.cid, input.assignee),
      activity: [entry(by, "Assigned a task", `${input.title} → ${PEOPLE[input.assignee]?.name ?? "Unassigned"}`, [input.assignee]), ...d.activity],
    }));
    return id;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<TaskInput>, by: RoleId, action = "Updated a task") => {
    setDb((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return d;
      const next: Task = { ...t, ...patch, updatedAt: Date.now() };
      return {
        ...d,
        tasks: d.tasks.map((x) => (x.id === id ? next : x)),
        campaigns: addToTeam(d.campaigns, next.cid, next.assignee),
        activity: [entry(by, action, next.title, [next.assignee]), ...d.activity],
      };
    });
  }, []);

  const setTaskStatus = useCallback((id: string, status: TaskStatus, by: RoleId, note = "") => setDb((d) => applyTaskStatus(d, id, status, by, note)), []);

  const addAsset = useCallback((input: Pick<Asset, "name" | "kind" | "uri">, by: RoleId) => {
    const id = uid("as");
    setDb((d) => ({ ...d, library: [{ ...input, id, addedBy: ROLES[by].personId }, ...d.library], activity: [entry(by, "Added an asset", input.name), ...d.activity] }));
    return id;
  }, []);
  const renameAsset = useCallback((id: string, name: string) => {
    const rename = (a: Asset) => (a.id === id ? { ...a, name } : a);
    setDb((d) => ({ ...d, library: d.library.map(rename), campaigns: d.campaigns.map((c) => ({ ...c, assets: c.assets.map(rename) })) }));
  }, []);
  const moveAsset = useCallback((id: string, cid: string | null, by: RoleId) => {
    setDb((d) => {
      const [a, rest] = takeAsset(d, id);
      if (!a) return d;
      const camp = d.campaigns.find((c) => c.id === cid);
      const placed = camp ? { ...rest, campaigns: rest.campaigns.map((c) => (c.id === cid ? { ...c, assets: [a, ...c.assets] } : c)) } : { ...rest, library: [a, ...rest.library] };
      return { ...placed, activity: [entry(by, camp ? "Linked an asset to a campaign" : "Unlinked an asset", camp ? `${a.name} → ${camp.name}` : a.name), ...placed.activity] };
    });
  }, []);
  const deleteAsset = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const [a, rest] = takeAsset(d, id);
      return a ? { ...rest, favorites: rest.favorites.filter((f) => f !== id), activity: [entry(by, "Deleted an asset", a.name), ...rest.activity] } : d;
    });
  }, []);
  const toggleFavorite = useCallback((id: string) => setDb((d) => ({ ...d, favorites: d.favorites.includes(id) ? d.favorites.filter((f) => f !== id) : [...d.favorites, id] })), []);

  const saveDraft = useCallback((input: DraftInput, by: RoleId, id?: string | null) => {
    const nid = id ?? uid("d");
    setDb((d) => {
      const exists = d.drafts.find((x) => x.id === nid);
      const drafts = exists
        ? d.drafts.map((x) => (x.id === nid ? { ...x, ...input, updatedAt: Date.now() } : x))
        : [{ ...input, id: nid, owner: ROLES[by].personId, status: "Draft" as const, updatedAt: Date.now() }, ...d.drafts];
      return { ...d, drafts, activity: [entry(by, exists ? "Updated a draft" : "Saved a draft", input.title || "Untitled draft", [exists?.owner ?? ROLES[by].personId]), ...d.activity] };
    });
    return nid;
  }, []);

  const setDraftStatus = useCallback((id: string, status: DraftStatus, by: RoleId, note = "") => {
    setDb((d) => {
      const dr = d.drafts.find((x) => x.id === id);
      if (!dr) return d;
      let next: Db = { ...d, drafts: d.drafts.map((x) => (x.id === id ? { ...x, status, updatedAt: Date.now() } : x)) };
      // Moving approved work back to editing pulls it out of the campaign's assets.
      if (status === "Draft") {
        next = { ...next, campaigns: next.campaigns.map((c) => ({ ...c, assets: c.assets.filter((a) => a.from !== dr.id && (!dr.taskId || a.from !== dr.taskId)) })) };
      }
      // A draft linked to a task moves the task through the same workflow.
      const linked = dr.taskId && d.tasks.some((t) => t.id === dr.taskId) ? DRAFT_TO_TASK[status] : undefined;
      if (linked && dr.taskId) return applyTaskStatus(next, dr.taskId, linked, by, note);
      if (status === "Approved" && dr.cid) {
        next = {
          ...next,
          campaigns: next.campaigns.map((c) =>
            c.id === dr.cid && !c.assets.some((a) => a.from === dr.id)
              ? { ...c, assets: [{ id: uid("as"), name: dr.title || "Untitled draft", kind: draftAssetKind(dr), addedBy: dr.owner, from: dr.id }, ...c.assets] }
              : c,
          ),
        };
      }
      return withReview({ ...next, activity: [entry(by, DRAFT_ACTION[status], dr.title || "Untitled draft", [dr.owner]), ...next.activity] }, "draft", id, status, by, note);
    });
  }, []);

  const deleteDraft = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const dr = d.drafts.find((x) => x.id === id);
      if (!dr) return d;
      return { ...d, drafts: d.drafts.filter((x) => x.id !== id), activity: [entry(by, "Deleted a draft", dr.title || "Untitled draft", [dr.owner]), ...d.activity] };
    });
  }, []);

  const deleteTask = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return d;
      return { ...d, tasks: d.tasks.filter((x) => x.id !== id), scheduled: d.scheduled.map((s) => (s.taskId === id ? { ...s, taskId: null } : s)), drafts: d.drafts.map((x) => (x.taskId === id ? { ...x, taskId: null } : x)), reviews: moveReviews(d, [id]), activity: [entry(by, "Deleted a task", t.title, [t.assignee]), ...d.activity] };
    });
  }, []);

  const savePost = useCallback((input: PostInput, by: RoleId, id?: string | null) => {
    const nid = id ?? uid("s");
    setDb((d) => {
      const old = d.scheduled.find((s) => s.id === nid);
      const moved = old && (old.date !== input.date || old.time !== input.time);
      const post: ScheduledPost = old
        ? { ...old, ...input, status: old.status === "Published" ? "Published" : moved || old.status === "Failed" ? "Scheduled" : old.status, note: moved ? "" : old.note }
        : { ...input, id: nid, owner: ROLES[by].personId, status: "Scheduled" };
      const scheduled = old ? d.scheduled.map((s) => (s.id === nid ? post : s)) : [post, ...d.scheduled];
      const action = !old ? "Scheduled a post" : moved ? "Rescheduled a post" : "Updated a scheduled post";
      // Scheduling a publishing task moves it to "Ready to publish".
      const t = input.taskId ? d.tasks.find((x) => x.id === input.taskId) : undefined;
      const base = { ...d, scheduled, activity: [entry(by, action, input.title), ...d.activity] };
      return t && !old && ["To do", "In progress", "Approved"].includes(t.status) ? applyTaskStatus(base, t.id, "Ready to publish", by) : base;
    });
    return nid;
  }, []);

  const setPostStatus = useCallback((id: string, status: PublishStatus, by: RoleId, note = "") => {
    setDb((d) => {
      const s = d.scheduled.find((x) => x.id === id);
      if (!s) return d;
      const next: Db = { ...d, scheduled: d.scheduled.map((x) => (x.id === id ? { ...x, status, note } : x)) };
      if (status === "Publishing") return next;
      const t = status === "Published" && s.taskId ? d.tasks.find((x) => x.id === s.taskId) : undefined;
      // Completing the linked task logs "Published a post" itself, so only one entry is added.
      if (t && t.status !== "Completed") return applyTaskStatus(next, t.id, "Completed", by);
      return { ...next, activity: [entry(by, POST_ACTION[status], s.title, [s.owner]), ...next.activity] };
    });
  }, []);

  const deletePost = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const s = d.scheduled.find((x) => x.id === id);
      return s ? { ...d, scheduled: d.scheduled.filter((x) => x.id !== id), activity: [entry(by, "Removed a scheduled post", s.title), ...d.activity] } : d;
    });
  }, []);

  const inviteMember = useCallback((input: MemberInput, by: RoleId) => {
    const id = uid("p");
    setDb((d) => ({
      ...d,
      people: { ...d.people, [id]: { ...input, id, initials: initialsOf(input.name ?? ""), status: "Invited" } },
      activity: [entry(by, "Invited a team member", `${input.name} as ${ROLES[input.role].label}`), ...d.activity],
    }));
    return id;
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<Person>, by: RoleId, action = "Updated a team member") => {
    setDb((d) => {
      const p = d.people[id];
      if (!p) return d;
      const next = { ...p, ...patch, initials: patch.name ? initialsOf(patch.name) : p.initials };
      return { ...d, people: { ...d.people, [id]: next }, activity: [entry(by, action, next.name), ...d.activity] };
    });
  }, []);

  const removeMember = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const p = d.people[id];
      if (!p || p.persona) return d;
      const me = ROLES[by].personId;
      const people = { ...d.people };
      delete people[id];
      return {
        ...d,
        people,
        // Their open work comes back to the manager who removed them.
        tasks: d.tasks.map((t) => (t.assignee === id ? { ...t, assignee: me, updatedAt: Date.now() } : t)),
        campaigns: d.campaigns.map((c) => ({ ...c, team: c.team.filter((x) => x !== id), members: c.members.filter((x) => x !== id) })),
        activity: [entry(by, "Removed a team member", p.name), ...d.activity],
      };
    });
  }, []);

  const updateBrand = useCallback((patch: Partial<BrandSettings>, by: RoleId) => {
    setDb((d) => ({ ...d, brand: { ...d.brand, ...patch }, activity: [entry(by, "Updated brand settings", patch.name ?? d.brand.name), ...d.activity] }));
  }, []);

  const saveVoice = useCallback((voice: Omit<BrandVoice, "id">, by: RoleId, id?: string | null) => {
    const nid = id ?? uid("v");
    setDb((d) => {
      const exists = d.voices.some((v) => v.id === nid);
      const voices = exists ? d.voices.map((v) => (v.id === nid ? { ...voice, id: nid } : v)) : [...d.voices, { ...voice, id: nid }];
      return { ...d, voices, activity: [entry(by, exists ? "Updated a brand voice" : "Added a brand voice", voice.name), ...d.activity] };
    });
    return nid;
  }, []);

  const deleteVoice = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const v = d.voices.find((x) => x.id === id);
      if (!v || d.voices.length <= 1 || d.brand.defaultVoice === id) return d;
      const fallback = d.brand.defaultVoice;
      return {
        ...d,
        voices: d.voices.filter((x) => x.id !== id),
        drafts: d.drafts.map((x) => (x.voiceId === id ? { ...x, voiceId: fallback } : x)),
        activity: [entry(by, "Deleted a brand voice", v.name), ...d.activity],
      };
    });
  }, []);

  const resetData = useCallback(() => setDb(seed()), []);

  syncRegistries(db);
  const value = useMemo(
    () => ({ db, createCampaign, updateCampaign, deleteCampaign, createTask, updateTask, setTaskStatus, deleteTask, saveDraft, setDraftStatus, deleteDraft, addAsset, renameAsset, moveAsset, deleteAsset, toggleFavorite, savePost, setPostStatus, deletePost, inviteMember, updateMember, removeMember, updateBrand, saveVoice, deleteVoice, resetData }),
    [db, createCampaign, updateCampaign, deleteCampaign, createTask, updateTask, setTaskStatus, deleteTask, saveDraft, setDraftStatus, deleteDraft, addAsset, renameAsset, moveAsset, deleteAsset, toggleFavorite, savePost, setPostStatus, deletePost, inviteMember, updateMember, removeMember, updateBrand, saveVoice, deleteVoice, resetData],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDb() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDb must be used inside DataProvider");
  return v;
}
