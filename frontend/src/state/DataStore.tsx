// Centralized local mock-data service. Every create / edit / delete / status change goes
// through here so the dashboard, lists, details and activity feed stay in sync.
// In-memory on purpose (each launch starts fresh). Swap the bodies for API calls later.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ROLES } from "@/src/config/roles";
import { ACTIVITY, CAMPAIGNS, PEOPLE, SCHEDULED, TASKS } from "@/src/data/mock";
import type { ActivityItem, Asset, Campaign, RoleId, ScheduledPost, Task, TaskStatus } from "@/src/types";

export interface Db {
  campaigns: Campaign[];
  tasks: Task[];
  activity: ActivityItem[];
  scheduled: ScheduledPost[];
}

export type CampaignInput = Pick<Campaign, "name" | "desc" | "status" | "start" | "end" | "visibility" | "team" | "channels">;
export type TaskInput = Pick<Task, "title" | "description" | "cid" | "module" | "assignee" | "due" | "priority" | "status" | "channels">;

const seed = (): Db => ({
  campaigns: CAMPAIGNS.map((c) => ({ ...c, team: [...c.team], members: [...c.members], channels: [...c.channels], assets: [...c.assets] })),
  tasks: TASKS.map((t) => ({ ...t, channels: [...t.channels] })),
  activity: [...ACTIVITY],
  scheduled: [...SCHEDULED],
});

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

interface Store {
  db: Db;
  createCampaign: (input: CampaignInput, by: RoleId) => string;
  updateCampaign: (id: string, input: CampaignInput, by: RoleId) => void;
  deleteCampaign: (id: string, by: RoleId) => void;
  createTask: (input: TaskInput, by: RoleId) => string;
  updateTask: (id: string, patch: Partial<TaskInput>, by: RoleId, action?: string) => void;
  setTaskStatus: (id: string, status: TaskStatus, by: RoleId) => void;
  deleteTask: (id: string, by: RoleId) => void;
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

  const setTaskStatus = useCallback((id: string, status: TaskStatus, by: RoleId) => {
    setDb((d) => {
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
      const action = status === "Completed" && t.module === "Library" ? "Published a post" : STATUS_ACTION[status];
      return { ...d, campaigns, tasks: d.tasks.map((x) => (x.id === id ? next : x)), activity: [entry(by, action, t.title, [t.assignee]), ...d.activity] };
    });
  }, []);

  const deleteTask = useCallback((id: string, by: RoleId) => {
    setDb((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return d;
      return { ...d, tasks: d.tasks.filter((x) => x.id !== id), activity: [entry(by, "Deleted a task", t.title, [t.assignee]), ...d.activity] };
    });
  }, []);

  const resetData = useCallback(() => setDb(seed()), []);

  const value = useMemo(
    () => ({ db, createCampaign, updateCampaign, deleteCampaign, createTask, updateTask, setTaskStatus, deleteTask, resetData }),
    [db, createCampaign, updateCampaign, deleteCampaign, createTask, updateTask, setTaskStatus, deleteTask, resetData],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDb() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDb must be used inside DataProvider");
  return v;
}
