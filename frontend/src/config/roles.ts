// Centralized DEMO role configuration. Every screen reads permissions, labels,
// navigation and actions from here — nothing is duplicated per screen.
// NOTE: this is UI prototyping only, not security enforcement.
import type { Href } from "expo-router";

import { destinationHref } from "@/src/config/modules";
import type { Draft, DraftStatus, ModuleKey, RoleId, Task, TaskStatus } from "@/src/types";

export type DashboardCardKey = "campaigns" | "tasks" | "approvals" | "scheduled" | "dueSoon";

export interface ActionDef {
  key: string;
  label: string;
  desc: string;
  icon: string;
  href: Href;
}

export interface RoleConfig {
  id: RoleId;
  label: string;
  badge: string;
  note: string;
  line: string;
  welcome: string;
  personId: string;
  /** Module list, same order as the web left rail */
  nav: ModuleKey[];
  quickActions: string[];
  createActions: string[];
  dashboardCards: DashboardCardKey[];
  permissions: {
    approveWork: boolean;
    createCampaign: boolean;
    createContent: boolean;
    publish: boolean;
    manageTeam: boolean;
    addOwners: boolean;
  };
}

export const ACTIONS: Record<string, ActionDef> = {
  content: { key: "content", label: "Content Studio", desc: "Write posts, articles and emails", icon: "document-text-outline", href: destinationHref("content") },
  ads: { key: "ads", label: "Ad Studio", desc: "Image & video ads", icon: "sparkles-outline", href: destinationHref("ads") },
  newCampaign: { key: "newCampaign", label: "Create Campaign", desc: "Plan channels, dates & team", icon: "megaphone-outline", href: "/campaign/edit" as Href },
  requestCampaign: { key: "requestCampaign", label: "Request Campaign", desc: "Ask a manager to approve it", icon: "paper-plane-outline", href: destinationHref("request-campaign") },
  approvals: { key: "approvals", label: "Review Approvals", desc: "Approve or request changes", icon: "checkmark-done-outline", href: destinationHref("approvals") },
  submissions: { key: "submissions", label: "My Submissions", desc: "Work waiting on approval", icon: "hourglass-outline", href: destinationHref("approvals") },
  publish: { key: "publish", label: "Schedule Queue", desc: "Posts ready to go live", icon: "calendar-outline", href: destinationHref("publish") },
  library: { key: "library", label: "Library", desc: "Find approved assets", icon: "albums-outline", href: destinationHref("library") },
  team: { key: "team", label: "Invite Team", desc: "Add people & set roles", icon: "person-add-outline", href: destinationHref("team") },
};

export const ROLE_ORDER: RoleId[] = ["super_admin", "admin", "editor", "publisher"];

export const ROLES: Record<RoleId, RoleConfig> = {
  super_admin: {
    id: "super_admin",
    label: "Super Admin",
    badge: "Full access",
    note: "Owns the workspace. Creates projects, invites anyone, approves work and publishes.",
    line: "Create a new workspace and own it.",
    welcome: "You own the workspace",
    personId: "rohi",
    nav: ["home", "tasks", "branding", "content", "ads", "library", "campaigns", "publish", "approvals", "team", "billing", "settings"],
    quickActions: ["content", "ads", "newCampaign", "team"],
    createActions: ["content", "ads", "newCampaign"],
    dashboardCards: ["campaigns", "tasks", "approvals", "scheduled"],
    permissions: { approveWork: true, createCampaign: true, createContent: true, publish: true, manageTeam: true, addOwners: true },
  },
  admin: {
    id: "admin",
    label: "Owner/Admin",
    badge: "Manage all · can’t add owners/admins",
    note: "Same rights as Super Admin, except creating or promoting another Owner/Admin.",
    line: "Join a workspace to run campaigns and approve work.",
    welcome: "You run the campaigns",
    personId: "aisha",
    nav: ["home", "tasks", "branding", "content", "ads", "library", "campaigns", "publish", "approvals", "team", "billing", "settings"],
    quickActions: ["approvals", "newCampaign", "content", "ads"],
    createActions: ["content", "ads", "newCampaign"],
    dashboardCards: ["campaigns", "tasks", "approvals", "scheduled"],
    permissions: { approveWork: true, createCampaign: true, createContent: true, publish: true, manageTeam: true, addOwners: false },
  },
  editor: {
    id: "editor",
    label: "Creator",
    badge: "Works assigned tasks",
    note: "Works only on tasks assigned by a Super Admin or Owner/Admin, then sends them for approval.",
    line: "Join a workspace to make the work you are given.",
    welcome: "You make the work",
    personId: "dev",
    nav: ["home", "tasks", "branding", "content", "ads", "library", "campaigns", "approvals", "settings"],
    quickActions: ["content", "ads", "submissions", "requestCampaign"],
    createActions: ["content", "ads", "requestCampaign"],
    dashboardCards: ["tasks", "dueSoon", "approvals", "campaigns"],
    permissions: { approveWork: false, createCampaign: false, createContent: true, publish: false, manageTeam: false, addOwners: false },
  },
  publisher: {
    id: "publisher",
    label: "Publisher",
    badge: "Publishes on schedule",
    note: "Receives approved campaigns and publishes them on the scheduled date.",
    line: "Join a workspace to schedule and publish approved work.",
    welcome: "You send it live",
    personId: "nikhil",
    nav: ["home", "publish", "approvals", "library", "campaigns", "settings"],
    quickActions: ["publish", "library", "approvals", "requestCampaign"],
    createActions: ["publish", "requestCampaign"],
    dashboardCards: ["scheduled", "tasks", "approvals", "campaigns"],
    permissions: { approveWork: false, createCampaign: false, createContent: false, publish: true, manageTeam: false, addOwners: false },
  },
};

export const isManager = (role: RoleId) => role === "super_admin" || role === "admin";

/** Workflow rules from the web workspace: managers run campaigns and assign work,
 * Creators work their assigned tasks and send them for approval,
 * Owner/Admins and Publishers review, Publishers send approved work live. */
export const can = {
  manageCampaigns: (r: RoleId) => isManager(r),
  manageTasks: (r: RoleId) => isManager(r),
  review: (r: RoleId) => isManager(r) || r === "publisher",
  changeDue: (r: RoleId, t: Task) => isManager(r) || (r === "publisher" && t.assignee === ROLES[r].personId),
  /** Publishers schedule approved work; they don't make content or ads. */
  useStudio: (r: RoleId) => r !== "publisher",
  /** Schedule, reschedule and publish (demo) posts. */
  publish: (r: RoleId) => ROLES[r].permissions.publish,
  manageTeam: (r: RoleId) => ROLES[r].permissions.manageTeam,
  editBrand: (r: RoleId) => isManager(r),
  /** Only a Super Admin can add or change Owner/Admins. */
  manageMember: (r: RoleId, target: RoleId) => ROLES[r].permissions.manageTeam && (ROLES[r].permissions.addOwners || !isManager(target)),
  editDraft: (r: RoleId, d: Draft) => isManager(r) || (d.owner === ROLES[r].personId && (d.status === "Draft" || d.status === "Changes requested")),
};

/** Roles this role may invite or assign. */
export const assignableRoles = (r: RoleId): RoleId[] => (ROLES[r].permissions.addOwners ? ROLE_ORDER : ROLE_ORDER.filter((x) => !isManager(x)));

export interface DraftAction {
  key: string;
  label: string;
  status: DraftStatus;
  icon: string;
  variant: "primary" | "secondary" | "ghost";
}

export function draftActions(d: Draft, role: RoleId): DraftAction[] {
  const mine = d.owner === ROLES[role].personId;
  const manager = isManager(role);
  const out: DraftAction[] = [];
  const editing = d.status === "Draft" || d.status === "Changes requested";
  if (editing && mine && !manager) out.push({ key: "submit", label: d.status === "Changes requested" ? "Send again for review" : "Send for approval", status: "In review", icon: "paper-plane-outline", variant: "primary" });
  if (manager && d.status === "In review") {
    out.push({ key: "approve", label: "Approve", status: "Approved", icon: "checkmark-done-outline", variant: "primary" });
    out.push({ key: "changes", label: "Request changes", status: "Changes requested", icon: "return-up-back-outline", variant: "secondary" });
  }
  if (manager && editing) out.push({ key: "approve", label: d.cid ? "Approve & add to campaign" : "Approve", status: "Approved", icon: "checkmark-done-outline", variant: "primary" });
  if (manager && d.status === "Approved") out.push({ key: "reopen", label: "Move back to draft", status: "Draft", icon: "arrow-undo-outline", variant: "ghost" });
  return out;
}

export function draftNote(d: Draft, role: RoleId): string | null {
  const mine = d.owner === ROLES[role].personId;
  if (d.status === "In review" && !isManager(role)) return mine ? "Sent for approval — waiting for a Super Admin or Owner/Admin." : "Waiting for a manager to review.";
  if (d.status === "Approved") return isManager(role) ? (d.cid ? "Approved. Saved to the campaign’s assets." : "Approved. Link a campaign to file it as an asset.") : "Approved — this draft is locked.";
  if (!mine && !isManager(role)) return "Only the author or a manager can change this draft.";
  return null;
}

export interface TaskAction {
  key: string;
  label: string;
  status: TaskStatus;
  icon: string;
  variant: "primary" | "secondary" | "ghost";
}

export function taskActions(t: Task, role: RoleId): TaskAction[] {
  const mine = t.assignee === ROLES[role].personId;
  const manager = isManager(role);
  const worker = manager || mine;
  const out: TaskAction[] = [];
  const add = (key: string, label: string, status: TaskStatus, icon: string, variant: TaskAction["variant"] = "secondary") =>
    out.push({ key, label, status, icon, variant });

  switch (t.status) {
    case "To do":
      if (worker) add("start", "Start working", "In progress", "play-outline", "primary");
      break;
    case "In progress":
      if (worker && t.module === "Library") add("ready", "Mark ready to publish", "Ready to publish", "calendar-outline", "primary");
      else if (worker) add("submit", "Send for approval", "In review", "paper-plane-outline", "primary");
      break;
    case "Changes requested":
      if (worker) add("resubmit", "Send again for review", "In review", "refresh-outline", "primary");
      break;
    case "In review":
      if (can.review(role) && (manager || !mine)) {
        add("approve", "Approve", "Approved", "checkmark-done-outline", "primary");
        add("changes", "Request changes", "Changes requested", "return-up-back-outline");
      }
      break;
    case "Approved":
      if (manager || role === "publisher") add("ready", "Mark ready to publish", "Ready to publish", "calendar-outline", "primary");
      break;
    case "Ready to publish":
      if (manager || role === "publisher") add("publish", "Mark published", "Completed", "rocket-outline", "primary");
      break;
    case "Completed":
      if (manager) add("reopen", "Reopen task", "To do", "arrow-undo-outline");
      break;
  }
  if (manager && t.status !== "Completed" && !out.some((a) => a.status === "Completed")) add("complete", "Mark complete", "Completed", "checkmark-circle-outline", "ghost");
  return out;
}

export function waitingNote(t: Task, role: RoleId): string | null {
  const mine = t.assignee === ROLES[role].personId;
  if (t.status === "In review" && mine && !isManager(role)) return "Sent for approval — waiting for an Owner/Admin or Publisher to review.";
  if (t.status === "Completed") return "This task is complete.";
  if (taskActions(t, role).length === 0) return "Only the assignee or a Super Admin / Owner/Admin can move this task.";
  return null;
}

/** Module labels follow the web app's per-role naming. */
export function moduleLabel(key: ModuleKey, role: RoleId): string {
  if (key === "approvals" && role === "editor") return "Submissions";
  if (key === "approvals" && role === "publisher") return "Review";
  if (key === "tasks" && role === "publisher") return "Publishing tasks";
  const labels: Record<ModuleKey, string> = {
    home: "Home", tasks: "My Tasks", branding: "Branding", content: "Content Studio", ads: "Ad Studio", library: "Library",
    campaigns: "Campaigns", publish: "Schedule queue", approvals: "Approvals", team: "Team", billing: "Billing", settings: "Settings",
  };
  return labels[key];
}

export const MODULE_ICONS: Record<ModuleKey, string> = {
  home: "home-outline", tasks: "checkbox-outline", branding: "color-palette-outline", content: "document-text-outline",
  ads: "sparkles-outline", library: "albums-outline", campaigns: "megaphone-outline", publish: "calendar-outline",
  approvals: "checkmark-done-outline", team: "people-outline", billing: "card-outline", settings: "settings-outline",
};
