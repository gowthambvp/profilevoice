// Mock data service. Every count on the dashboard is derived here from the mock data.
// Swap these selectors for API calls in a later phase; screens won't need to change.
import { ACTIONS, ROLES, isManager, type DashboardCardKey } from "@/src/config/roles";
import { ACTIVITY, APPROVALS, CAMPAIGNS, DEMO_TODAY, PEOPLE, SCHEDULED, TASKS } from "@/src/data/mock";
import type { Campaign, RoleId, Task } from "@/src/types";

const CLOSED: Task["status"][] = ["Completed", "Approved"];
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const person = (id: string) => PEOPLE[id] ?? { id, name: "Unassigned", initials: "?", role: "editor" as const };
export const campaignById = (id: string | null) => CAMPAIGNS.find((c) => c.id === id);

export function visibleCampaigns(role: RoleId): Campaign[] {
  const me = ROLES[role].personId;
  return CAMPAIGNS.filter((c) => isManager(role) || role === "publisher" || c.visibility !== "private" || c.members.includes(me));
}

/** Tasks the role is responsible for: managers oversee all, others see their own. */
export function roleTasks(role: RoleId): Task[] {
  if (isManager(role)) return TASKS;
  return TASKS.filter((t) => t.assignee === ROLES[role].personId);
}

export const openTasks = (role: RoleId) => roleTasks(role).filter((t) => !CLOSED.includes(t.status));

export function pendingApprovals(role: RoleId) {
  const pending = APPROVALS.filter((a) => a.state === "pending");
  if (role === "editor") return pending.filter((a) => a.from === ROLES.editor.personId);
  return pending;
}

export function upcomingScheduled(role: RoleId) {
  const ids = new Set(visibleCampaigns(role).map((c) => c.id));
  return SCHEDULED.filter((s) => s.state !== "Completed" && (!s.cid || ids.has(s.cid))).sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );
}

export const dueSoon = (role: RoleId) => openTasks(role).filter((t) => daysBetween(DEMO_TODAY, t.due) <= 3);

export function attentionTasks(role: RoleId): Task[] {
  return openTasks(role)
    .filter((t) => t.status === "Changes requested" || t.status === "Ready to publish" || daysBetween(DEMO_TODAY, t.due) <= 2)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function recentCampaigns(role: RoleId): Campaign[] {
  const rank = { Active: 0, Scheduled: 1, Draft: 2, Completed: 3 } as const;
  return visibleCampaigns(role)
    .filter((c) => c.status !== "Completed")
    .sort((a, b) => rank[a.status] - rank[b.status]);
}

export const activityFor = (role: RoleId) => ACTIVITY.filter((a) => a.roles.includes(role));

export function dueLabel(due: string) {
  const d = daysBetween(DEMO_TODAY, due);
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

export function summaryCards(role: RoleId): SummaryCard[] {
  const manager = isManager(role);
  const active = visibleCampaigns(role).filter((c) => c.status === "Active").length;
  const sched = upcomingScheduled(role);
  const build: Record<DashboardCardKey, SummaryCard> = {
    campaigns: { key: "campaigns", label: "Active campaigns", hint: `${visibleCampaigns(role).length} in workspace`, count: active, icon: "megaphone", target: "campaigns" },
    tasks: {
      key: "tasks",
      label: manager ? "Pending tasks" : role === "publisher" ? "Publishing tasks" : "My tasks",
      hint: manager ? "Across the team" : "Assigned to you",
      count: openTasks(role).length,
      icon: "checkbox",
      target: "tasks",
    },
    approvals: {
      key: "approvals",
      label: role === "editor" ? "Awaiting approval" : role === "publisher" ? "To review" : "Pending approvals",
      hint: role === "editor" ? "Your submissions" : "Waiting on a decision",
      count: pendingApprovals(role).length,
      icon: "checkmark-done",
      target: "approvals",
    },
    scheduled: { key: "scheduled", label: "Scheduled posts", hint: sched[0] ? `Next: ${formatDate(sched[0].date)}` : "Nothing queued", count: sched.length, icon: "calendar", target: "publish" },
    dueSoon: { key: "dueSoon", label: "Due this week", hint: "Next 3 days", count: dueSoon(role).length, icon: "time", target: "tasks" },
  };
  return ROLES[role].dashboardCards.map((k) => build[k]);
}

export const actionsFor = (keys: string[]) => keys.map((k) => ACTIONS[k]).filter(Boolean);

export const notificationCount = (role: RoleId) => pendingApprovals(role).length + attentionTasks(role).length;
