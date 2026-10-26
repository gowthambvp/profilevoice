// DEMO DATA — local only. Mirrors the ProfileVoice role-based workspace prototype.
// Replace with API calls in src/services/* when the backend is ready.
import type { ActivityItem, Approval, Campaign, Channel, Person, ScheduledPost, Task, Workspace } from "@/src/types";

/** The prototype runs on a fixed "today" so dates and due-soon logic stay consistent. */
export const DEMO_TODAY = "2026-09-24";

export const WORKSPACE: Workspace = { name: "ProfileVoice", project: "Herbal Care", projectCode: "HC-2026" };

export const PEOPLE: Record<string, Person> = {
  rohi: { id: "rohi", name: "Rohi M.", initials: "RM", role: "super_admin" },
  aisha: { id: "aisha", name: "Aisha K.", initials: "AK", role: "admin" },
  dev: { id: "dev", name: "Dev R.", initials: "DR", role: "editor" },
  nikhil: { id: "nikhil", name: "Nikhil S.", initials: "NS", role: "publisher" },
};

// Channel brand colors stay identical across themes, so literals are fine here.
export const CHANNELS: Record<string, Channel> = {
  youtube: { id: "youtube", label: "YouTube", abbr: "Yt", color: "#B23A2E" },
  tiktok: { id: "tiktok", label: "TikTok", abbr: "Tt", color: "#1F2937" },
  instagram: { id: "instagram", label: "Instagram", abbr: "Ig", color: "#B2367A" },
  facebook: { id: "facebook", label: "Facebook", abbr: "Fb", color: "#2158A6" },
  pinterest: { id: "pinterest", label: "Pinterest", abbr: "Pi", color: "#B0293C" },
  x: { id: "x", label: "X", abbr: "X", color: "#1F2937" },
  linkedin: { id: "linkedin", label: "LinkedIn", abbr: "In", color: "#1E5FA0" },
};

export const CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Festive Drop — Instagram + Email", owner: "aisha", status: "Active", start: "2026-09-22", end: "2026-10-05", desc: "Push the festive collection across Instagram and email in the run-up to the sale.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "facebook"] },
  { id: "c2", name: "Launch Week Teasers", owner: "rohi", status: "Scheduled", start: "2026-09-25", end: "2026-09-30", desc: "Build anticipation with daily teasers before the brand-product goes live.", visibility: "public", members: [], team: ["rohi", "nikhil"], channels: ["instagram", "linkedin"] },
  { id: "c3", name: "Retargeting — Meta Ads", owner: "aisha", status: "Draft", start: "", end: "", desc: "", visibility: "private", members: ["rohi", "aisha", "dev"], team: ["aisha", "dev"], channels: ["facebook", "instagram"] },
  { id: "c4", name: "Diwali Gifting Drop", owner: "rohi", status: "Active", start: "2026-10-08", end: "2026-10-24", desc: "Promote the Diwali gift sets with reels, a gift guide and a festive carousel.", visibility: "public", members: [], team: ["rohi", "dev", "nikhil"], channels: ["youtube", "instagram", "facebook", "x"] },
  { id: "c5", name: "Winter Restock Teaser", owner: "aisha", status: "Scheduled", start: "2026-11-02", end: "2026-11-09", desc: "Tease the winter restock before it lands.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "facebook"] },
  { id: "c6", name: "Brand Refresh — Logo & Voice", owner: "rohi", status: "Draft", start: "2026-11-10", end: "2026-11-24", desc: "Refresh the logo lockups and write the new brand voice. Managers and Publishers only.", visibility: "private", members: ["rohi", "aisha", "nikhil"], team: ["aisha", "dev"], channels: ["linkedin"] },
  { id: "c7", name: "Summer Sale Wrap-up", owner: "aisha", status: "Completed", start: "2026-08-20", end: "2026-09-05", desc: "Final push and recap posts for the summer sale.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "linkedin"] },
  { id: "c8", name: "Influencer Collab — Reels", owner: "dev", status: "Active", start: "2026-10-01", end: "2026-10-20", desc: "Created from Dev’s request — reels with three creators.", visibility: "public", members: [], team: ["dev", "nikhil", "aisha"], channels: ["instagram", "youtube"] },
  { id: "c9", name: "Newsletter Relaunch", owner: "nikhil", status: "Scheduled", start: "2026-10-26", end: "2026-11-02", desc: "Created from Nikhil’s request — a fresh monthly newsletter format.", visibility: "public", members: [], team: ["nikhil", "dev", "rohi"], channels: ["linkedin", "facebook"] },
];

export const TASKS: Task[] = [
  { id: "t1", cid: "c1", title: "Write 3 hook variants for the reel", module: "Ad Studio", assignee: "dev", due: "2026-09-23", status: "In review", channels: ["instagram"] },
  { id: "t2", cid: "c1", title: "Email copy pass for the drop", module: "Content", assignee: "dev", due: "2026-09-24", status: "In progress", channels: ["facebook", "instagram"] },
  { id: "t3", cid: "c1", title: "Generate 4 image ads on FLUX.2 Pro", module: "Ad Studio", assignee: "dev", due: "2026-09-24", status: "To do", channels: ["instagram", "facebook"] },
  { id: "t4", cid: "c1", title: "Schedule the Instagram carousel", module: "Library", assignee: "nikhil", due: "2026-09-26", status: "Ready to publish", channels: ["instagram"] },
  { id: "t8", cid: "c1", title: "Brand-product descriptions for the festive range", module: "Content", assignee: "dev", due: "2026-09-25", status: "Changes requested", channels: ["instagram", "pinterest"] },
  { id: "t9", cid: "c1", title: "Gift guide article: 10 picks under ₹999", module: "Content", assignee: "dev", due: "2026-09-27", status: "To do", channels: ["pinterest", "linkedin"] },
  { id: "t10", cid: "c1", title: "Landing page copy for the drop", module: "Content", assignee: "dev", due: "2026-09-22", status: "Completed", channels: ["facebook", "instagram"] },
  { id: "t11", cid: "c1", title: "15-second festive video ad, 9:16", module: "Ad Studio", assignee: "dev", due: "2026-09-28", status: "To do", channels: ["instagram", "youtube"] },
  { id: "t5", cid: "c2", title: "Teaser blog post: day 1", module: "Content", assignee: "dev", due: "2026-09-25", status: "To do", channels: ["linkedin", "x"] },
  { id: "t6", cid: "c2", title: "Publish teaser 1 at 9:00 AM", module: "Library", assignee: "nikhil", due: "2026-09-25", status: "Ready to publish", channels: ["instagram"] },
  { id: "t7", cid: "c3", title: "4 retargeting image variants", module: "Ad Studio", assignee: "dev", due: "2026-10-08", status: "In review", channels: ["facebook", "instagram"] },
  { id: "t20", cid: "c4", title: "Diwali gifting reel — 15s, 9:16", module: "Ad Studio", assignee: "dev", due: "2026-10-12", status: "In progress", channels: ["instagram", "youtube"] },
  { id: "t21", cid: "c4", title: "Gift guide article: 10 picks", module: "Content", assignee: "dev", due: "2026-10-11", status: "In review", channels: ["linkedin"] },
  { id: "t23", cid: "c4", title: "Schedule the Diwali reel", module: "Library", assignee: "nikhil", due: "2026-10-14", status: "Ready to publish", channels: ["youtube"] },
  { id: "t26", cid: "c5", title: "Schedule teaser 1", module: "Library", assignee: "nikhil", due: "2026-11-03", status: "To do", channels: ["instagram"] },
  { id: "t28", cid: "c6", title: "Brand voice pass", module: "Branding", assignee: "aisha", due: "2026-11-20", status: "To do", channels: [] },
];

export const APPROVALS: Approval[] = [
  { id: "a1", title: "3 hook variants for the reel", from: "dev", taskId: "t1", module: "Ad Studio", sent: "Today, 10:12", state: "pending" },
  { id: "a2", title: "4 retargeting image variants", from: "dev", taskId: "t7", module: "Ad Studio", sent: "Today, 09:20", state: "pending" },
  { id: "a3", title: "Gift guide article: 10 picks", from: "dev", taskId: "t21", module: "Content", sent: "Yesterday", state: "pending" },
];

export const SCHEDULED: ScheduledPost[] = [
  { id: "s1", cid: "c2", date: "2026-09-25", time: "09:00", title: "Teaser 1 — Instagram", channels: ["instagram"], owner: "nikhil", state: "In progress" },
  { id: "s2", cid: "c1", date: "2026-09-26", time: "11:30", title: "Festive carousel", channels: ["instagram", "facebook"], owner: "nikhil", state: "In progress" },
  { id: "s3", cid: "c1", date: "2026-09-29", time: "08:00", title: "Drop announcement", channels: ["linkedin"], owner: "nikhil", state: "In progress" },
  { id: "s20", cid: "c4", date: "2026-10-14", time: "18:00", title: "Diwali reel — YouTube", channels: ["youtube"], owner: "nikhil", state: "In progress" },
  { id: "s21", cid: "c8", date: "2026-10-05", time: "18:00", title: "Creator reel #1", channels: ["instagram"], owner: "nikhil", state: "In progress" },
  { id: "s22", cid: "c7", date: "2026-08-28", time: "10:00", title: "Sale recap", channels: ["instagram"], owner: "nikhil", state: "Completed" },
];

const MANAGERS: ActivityItem["roles"] = ["super_admin", "admin"];
export const ACTIVITY: ActivityItem[] = [
  { id: "ac1", actor: "dev", action: "Submitted work for approval", detail: "3 hook variants for the reel", at: "Today, 10:12", roles: [...MANAGERS, "editor"] },
  { id: "ac2", actor: "nikhil", action: "Commented on a scheduled item", detail: "Drop announcement", at: "Today, 10:05", roles: [...MANAGERS, "publisher"] },
  { id: "ac3", actor: "aisha", action: "Requested changes", detail: "Brand-product descriptions for the festive range", at: "Today, 09:40", roles: [...MANAGERS, "editor"] },
  { id: "ac4", actor: "dev", action: "Submitted work for approval", detail: "4 retargeting image variants", at: "Today, 09:20", roles: [...MANAGERS, "editor"] },
  { id: "ac5", actor: "rohi", action: "Created a campaign", detail: "Diwali Gifting Drop", at: "Yesterday", roles: [...MANAGERS, "editor", "publisher"] },
  { id: "ac6", actor: "nikhil", action: "Published a post", detail: "Teaser 1 — Instagram", at: "Yesterday, 09:00", roles: [...MANAGERS, "publisher"] },
  { id: "ac7", actor: "dev", action: "Updated a draft", detail: "Launch sub-brand voice", at: "Yesterday", roles: ["editor"] },
  { id: "ac8", actor: "nikhil", action: "Scheduled a post", detail: "Festive carousel — Instagram", at: "2 days ago", roles: [...MANAGERS, "publisher"] },
  { id: "ac9", actor: "rohi", action: "Invited a team member", detail: "Nikhil S. joined as Publisher", at: "3 days ago", roles: ["super_admin"] },
];
