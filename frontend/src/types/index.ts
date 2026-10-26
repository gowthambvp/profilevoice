// Shared TypeScript interfaces. Shapes mirror the ProfileVoice web workspace so a
// future API can return the same objects.

export type RoleId = "super_admin" | "admin" | "editor" | "publisher";

export type ModuleKey =
  | "home"
  | "tasks"
  | "branding"
  | "content"
  | "ads"
  | "library"
  | "campaigns"
  | "publish"
  | "approvals"
  | "team"
  | "billing"
  | "settings";

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: RoleId;
}

export interface Workspace {
  name: string;
  project: string;
  projectCode: string;
}

export type CampaignStatus = "Active" | "Scheduled" | "Draft" | "Completed";

export interface Campaign {
  id: string;
  name: string;
  owner: string;
  status: CampaignStatus;
  start: string;
  end: string;
  desc: string;
  visibility: "public" | "private";
  members: string[];
  team: string[];
  channels: string[];
  assets: Asset[];
}

export interface Asset {
  id: string;
  name: string;
  kind: "image" | "video" | "doc" | "post";
  addedBy: string;
  /** task id the asset came from */
  from?: string;
}

export type Priority = "High" | "Medium" | "Low";

export type TaskStatus =
  | "To do"
  | "In progress"
  | "In review"
  | "Changes requested"
  | "Approved"
  | "Ready to publish"
  | "Completed";

export interface Task {
  id: string;
  cid: string;
  title: string;
  module: "Content" | "Ad Studio" | "Library" | "Branding";
  assignee: string;
  due: string;
  status: TaskStatus;
  channels: string[];
  priority: Priority;
  description: string;
  /** ms timestamp for "recently updated" sorting */
  updatedAt: number;
  /** when it was last sent for approval */
  submittedAt?: string;
}

export interface ScheduledPost {
  id: string;
  cid: string | null;
  date: string;
  time: string;
  title: string;
  channels: string[];
  owner: string;
  state: "In progress" | "Completed";
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  detail: string;
  at: string;
  roles: RoleId[];
}

export interface Channel {
  id: string;
  label: string;
  abbr: string;
  color: string;
}
