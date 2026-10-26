// Centralized DEMO role configuration. Every screen reads permissions, labels,
// navigation and actions from here — nothing is duplicated per screen.
// NOTE: this is UI prototyping only, not security enforcement.
import type { Href } from "expo-router";

import { destinationHref } from "@/src/config/modules";
import type { ModuleKey, RoleId } from "@/src/types";

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
  newCampaign: { key: "newCampaign", label: "Create Campaign", desc: "Plan channels, dates & team", icon: "megaphone-outline", href: destinationHref("new-campaign") },
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
