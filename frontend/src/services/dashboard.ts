// Read-side selectors over the local data store. Every count on every screen is derived here.
import { ACTIONS, ROLES, isManager, type DashboardCardKey } from "@/src/config/roles";
import { DEMO_TODAY, PEOPLE } from "@/src/data/mock";
import type { Db } from "@/src/state/DataStore";
import type { Campaign, Priority, RoleId, Task } from "@/src/types";

// Approved work still has to be scheduled and published, so only Completed is closed.
const CLOSED: Task["status"][] = ["Completed"];
const DONE_FOR_PROGRESS: Task["status"][] = ["Completed", "Approved", "Ready to publish"];

export const daysFromToday = (iso: string) =>
  Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${DEMO_TODAY}T00:00:00`).getTime()) / 86400000);
export const isOpen = (t: Task) => !CLOSED.includes(t.status);
export const isOverdue = (t: Task) => isOpen(t) && daysFromToday(t.due) < 0;
export const isUpcoming = (t: Task) => isOpen(t) && daysFromToday(t.due) >= 0 && daysFromToday(t.due) <= 7;

export const person = (id: string) => PEOPLE[id] ?? { id, name: "Unassigned", initials: "?", role: "editor" as const };
export const campaignById = (db: Db, id: string | null | undefined) => db.campaigns.find((c) => c.id === id);
export const myId = (role: RoleId) => ROLES[role].personId;

export function visibleCampaigns(db: Db, role: RoleId): Campaign[] {
  const me = myId(role);
  return db.campaigns.filter((c) => isManager(role) || role === "publisher" || c.visibility !== "private" || c.members.includes(me));
}

export type TaskScope = "mine" | "team" | "all";

/** Managers can look at My / Team / All tasks; Creators and Publishers only see their own. */
export function roleTasks(db: Db, role: RoleId, scope: TaskScope = "all"): Task[] {
  const ids = new Set(visibleCampaigns(db, role).map((c) => c.id));
  const visible = db.tasks.filter((t) => ids.has(t.cid));
  const me = myId(role);
  if (!isManager(role) || scope === "mine") return visible.filter((t) => t.assignee === me);
  if (scope === "team") return visible.filter((t) => t.assignee !== me);
  return visible;
}

export const openTasks = (db: Db, role: RoleId) => roleTasks(db, role).filter(isOpen);

/** Work waiting on a decision. Creators see their own submissions. */
export function pendingApprovals(db: Db, role: RoleId): Task[] {
  const all = db.tasks.filter((t) => t.status === "In review");
  return role === "editor" ? all.filter((t) => t.assignee === myId(role)) : all;
}

export function upcomingScheduled(db: Db, role: RoleId) {
  const ids = new Set(visibleCampaigns(db, role).map((c) => c.id));
  return db.scheduled
    .filter((s) => s.state !== "Completed" && (!s.cid || ids.has(s.cid)))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export const dueSoon = (db: Db, role: RoleId) => openTasks(db, role).filter((t) => daysFromToday(t.due) <= 3);

export function attentionTasks(db: Db, role: RoleId): Task[] {
  return openTasks(db, role)
    .filter((t) => t.status === "Changes requested" || t.status === "Ready to publish" || daysFromToday(t.due) <= 2)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function recentCampaigns(db: Db, role: RoleId): Campaign[] {
  const rank = { Active: 0, Scheduled: 1, Draft: 2, Completed: 3 } as const;
  return visibleCampaigns(db, role)
    .filter((c) => c.status !== "Completed")
    .sort((a, b) => rank[a.status] - rank[b.status]);
}

export const activityFor = (db: Db, role: RoleId) => db.activity.filter((a) => a.roles.includes(role));
export const campaignTasks = (db: Db, cid: string) => db.tasks.filter((t) => t.cid === cid);

export function campaignProgress(db: Db, cid: string) {
  const tasks = campaignTasks(db, cid);
  const done = tasks.filter((t) => DONE_FOR_PROGRESS.includes(t.status)).length;
  return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
export type SortKey = "due" | "priority" | "recent";
export function sortTasks(list: Task[], key: SortKey): Task[] {
  const l = [...list];
  if (key === "priority") return l.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.due.localeCompare(b.due));
  if (key === "recent") return l.sort((a, b) => b.updatedAt - a.updatedAt);
  return l.sort((a, b) => a.due.localeCompare(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export type Bucket = "Overdue" | "Due today" | "This week" | "Later" | "Done";
export function dueBucket(t: Task): Bucket {
  if (!isOpen(t)) return "Done";
  const d = daysFromToday(t.due);
  if (d < 0) return "Overdue";
  if (d === 0) return "Due today";
  if (d <= 7) return "This week";
  return "Later";
}

export function dueLabel(due: string) {
  const d = daysFromToday(due);
  if (d < 0) return { text: `Overdue ${-d}d`, tone: "error" as const };
  if (d === 0) return { text: "Due today", tone: "warning" as const };
  if (d === 1) return { text: "Due tomorrow", tone: "warning" as const };
  return { text: `Due ${formatDate(due)}`, tone: "neutral" as const };
}

export function formatDate(iso: string) {
  if (!iso) return "No date";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function format12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export interface SummaryCard {
  key: DashboardCardKey;
  label: string;
  hint: string;
  count: number;
  icon: string;
  target: "campaigns" | "tasks" | "approvals" | "publish";
}

export function summaryCards(db: Db, role: RoleId): SummaryCard[] {
  const manager = isManager(role);
  const visible = visibleCampaigns(db, role);
  const sched = upcomingScheduled(db, role);
  const overdue = openTasks(db, role).filter(isOverdue).length;
  const build: Record<DashboardCardKey, SummaryCard> = {
    campaigns: { key: "campaigns", label: "Active campaigns", hint: `${visible.length} in workspace`, count: visible.filter((c) => c.status === "Active").length, icon: "megaphone", target: "campaigns" },
    tasks: {
      key: "tasks",
      label: manager ? "Pending tasks" : role === "publisher" ? "Publishing tasks" : "My tasks",
      hint: overdue ? `${overdue} overdue` : manager ? "Across the team" : "Assigned to you",
      count: openTasks(db, role).length,
      icon: "checkbox",
      target: "tasks",
    },
    approvals: {
      key: "approvals",
      label: role === "editor" ? "Awaiting approval" : role === "publisher" ? "To review" : "Pending approvals",
      hint: role === "editor" ? "Your submissions" : "Waiting on a decision",
      count: pendingApprovals(db, role).length,
      icon: "checkmark-done",
      target: "approvals",
    },
    scheduled: { key: "scheduled", label: "Scheduled posts", hint: sched[0] ? `Next: ${formatDate(sched[0].date)}` : "Nothing queued", count: sched.length, icon: "calendar", target: "publish" },
    dueSoon: { key: "dueSoon", label: "Due this week", hint: "Overdue or next 3 days", count: dueSoon(db, role).length, icon: "time", target: "tasks" },
  };
  return ROLES[role].dashboardCards.map((k) => build[k]);
}

export const actionsFor = (keys: string[]) => keys.map((k) => ACTIONS[k]).filter(Boolean);

export const notificationCount = (db: Db, role: RoleId) => pendingApprovals(db, role).length + attentionTasks(db, role).length;
