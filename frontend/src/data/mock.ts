// DEMO DATA — local only. Mirrors the ProfileVoice role-based workspace prototype.
// Replace with API calls in src/services/* when the backend is ready.
import type { ActivityItem, Asset, BrandSettings, Campaign, Draft, Review, Channel, Person, ScheduledPost, Task, Workspace } from "@/src/types";

/** The prototype runs on a fixed "today" so dates and due-soon logic stay consistent. */
export const DEMO_TODAY = "2026-09-24";

export const WORKSPACE: Workspace = { name: "ProfileVoice", project: "Herbal Care", projectCode: "HC-2026" };

export const TEAM: Person[] = [
  { id: "rohi", name: "Rohi M.", initials: "RM", role: "super_admin", email: "rohi@herbalcare.demo", title: "Founder", status: "Active", persona: true },
  { id: "aisha", name: "Aisha K.", initials: "AK", role: "admin", email: "aisha@herbalcare.demo", title: "Marketing lead", status: "Active", persona: true },
  { id: "dev", name: "Dev R.", initials: "DR", role: "editor", email: "dev@herbalcare.demo", title: "Content creator", status: "Active", persona: true },
  { id: "nikhil", name: "Nikhil S.", initials: "NS", role: "publisher", email: "nikhil@herbalcare.demo", title: "Social publisher", status: "Active", persona: true },
  { id: "meera", name: "Meera P.", initials: "MP", role: "editor", email: "meera@herbalcare.demo", title: "Designer", status: "Active" },
  { id: "sam", name: "Sam T.", initials: "ST", role: "publisher", email: "sam@herbalcare.demo", title: "Community manager", status: "Invited" },
];

/** Live lookup of team members. The data store keeps it in sync with demo edits. */
export const PEOPLE: Record<string, Person> = Object.fromEntries(TEAM.map((p) => [p.id, { ...p }]));

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
  { id: "c1", name: "Festive Drop — Instagram + Email", owner: "aisha", status: "Active", start: "2026-09-22", end: "2026-10-05", desc: "Push the festive collection across Instagram and email in the run-up to the sale.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "facebook"], assets: [{ id: "as1", name: "Festive hero image", kind: "image", addedBy: "dev" }, { id: "as2", name: "Landing page copy for the drop", kind: "doc", addedBy: "dev", from: "t10" }] },
  { id: "c2", name: "Launch Week Teasers", owner: "rohi", status: "Scheduled", start: "2026-09-25", end: "2026-09-30", desc: "Build anticipation with daily teasers before the brand-product goes live.", visibility: "public", members: [], team: ["rohi", "nikhil"], channels: ["instagram", "linkedin"], assets: [{ id: "as3", name: "Teaser 1 visual", kind: "image", addedBy: "dev" }] },
  { id: "c3", name: "Retargeting — Meta Ads", owner: "aisha", status: "Draft", start: "", end: "", desc: "", visibility: "private", members: ["rohi", "aisha", "dev"], team: ["aisha", "dev"], channels: ["facebook", "instagram"], assets: [] },
  { id: "c4", name: "Diwali Gifting Drop", owner: "rohi", status: "Active", start: "2026-10-08", end: "2026-10-24", desc: "Promote the Diwali gift sets with reels, a gift guide and a festive carousel.", visibility: "public", members: [], team: ["rohi", "dev", "nikhil"], channels: ["youtube", "instagram", "facebook", "x"], assets: [{ id: "as4", name: "Diwali gift set reel (draft)", kind: "video", addedBy: "dev" }] },
  { id: "c5", name: "Winter Restock Teaser", owner: "aisha", status: "Scheduled", start: "2026-11-02", end: "2026-11-09", desc: "Tease the winter restock before it lands.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "facebook"], assets: [] },
  { id: "c6", name: "Brand Refresh — Logo & Voice", owner: "rohi", status: "Draft", start: "2026-11-10", end: "2026-11-24", desc: "Refresh the logo lockups and write the new brand voice. Managers and Publishers only.", visibility: "private", members: ["rohi", "aisha", "nikhil"], team: ["aisha", "dev"], channels: ["linkedin"], assets: [] },
  { id: "c7", name: "Summer Sale Wrap-up", owner: "aisha", status: "Completed", start: "2026-08-20", end: "2026-09-05", desc: "Final push and recap posts for the summer sale.", visibility: "public", members: [], team: ["aisha", "dev", "nikhil"], channels: ["instagram", "linkedin"], assets: [{ id: "as5", name: "Summer sale recap carousel", kind: "post", addedBy: "nikhil" }, { id: "as6", name: "Sale recap video", kind: "video", addedBy: "dev" }] },
  { id: "c8", name: "Influencer Collab — Reels", owner: "dev", status: "Active", start: "2026-10-01", end: "2026-10-20", desc: "Created from Dev’s request — reels with three creators.", visibility: "public", members: [], team: ["dev", "nikhil", "aisha"], channels: ["instagram", "youtube"], assets: [] },
  { id: "c9", name: "Newsletter Relaunch", owner: "nikhil", status: "Scheduled", start: "2026-10-26", end: "2026-11-02", desc: "Created from Nikhil’s request — a fresh monthly newsletter format.", visibility: "public", members: [], team: ["nikhil", "dev", "rohi"], channels: ["linkedin", "facebook"], assets: [] },
];

export const TASKS: Task[] = [
  { id: "t1", cid: "c1", title: "Write 3 hook variants for the reel", module: "Ad Studio", assignee: "dev", due: "2026-09-23", status: "In review", channels: ["instagram"], priority: "High", description: "Follow the festive brand kit. Deliver 9:16 and 1:1 versions with a clear product shot.", updatedAt: 100, submittedAt: "Today, 10:12" },
  { id: "t2", cid: "c1", title: "Email copy pass for the drop", module: "Content", assignee: "dev", due: "2026-09-24", status: "In progress", channels: ["facebook", "instagram"], priority: "High", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 99 },
  { id: "t3", cid: "c1", title: "Generate 4 image ads on FLUX.2 Pro", module: "Ad Studio", assignee: "dev", due: "2026-09-24", status: "To do", channels: ["instagram", "facebook"], priority: "Medium", description: "Follow the festive brand kit. Deliver 9:16 and 1:1 versions with a clear product shot.", updatedAt: 98 },
  { id: "t4", cid: "c1", title: "Schedule the Instagram carousel", module: "Library", assignee: "nikhil", due: "2026-09-26", status: "Ready to publish", channels: ["instagram"], priority: "High", description: "Use the approved asset from the Library and post it at the scheduled time.", updatedAt: 97 },
  { id: "t8", cid: "c1", title: "Brand-product descriptions for the festive range", module: "Content", assignee: "dev", due: "2026-09-25", status: "Changes requested", channels: ["instagram", "pinterest"], priority: "High", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 96 },
  { id: "t9", cid: "c1", title: "Gift guide article: 10 picks under ₹999", module: "Content", assignee: "dev", due: "2026-09-27", status: "To do", channels: ["pinterest", "linkedin"], priority: "Medium", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 95 },
  { id: "t10", cid: "c1", title: "Landing page copy for the drop", module: "Content", assignee: "dev", due: "2026-09-22", status: "Completed", channels: ["facebook", "instagram"], priority: "Low", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 94 },
  { id: "t11", cid: "c1", title: "15-second festive video ad, 9:16", module: "Ad Studio", assignee: "dev", due: "2026-09-28", status: "To do", channels: ["instagram", "youtube"], priority: "Medium", description: "Follow the festive brand kit. Deliver 9:16 and 1:1 versions with a clear product shot.", updatedAt: 93 },
  { id: "t5", cid: "c2", title: "Teaser blog post: day 1", module: "Content", assignee: "dev", due: "2026-09-25", status: "To do", channels: ["linkedin", "x"], priority: "Medium", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 92 },
  { id: "t6", cid: "c2", title: "Publish teaser 1 at 9:00 AM", module: "Library", assignee: "nikhil", due: "2026-09-25", status: "Ready to publish", channels: ["instagram"], priority: "High", description: "Use the approved asset from the Library and post it at the scheduled time.", updatedAt: 91 },
  { id: "t7", cid: "c3", title: "4 retargeting image variants", module: "Ad Studio", assignee: "dev", due: "2026-10-08", status: "In review", channels: ["facebook", "instagram"], priority: "Medium", description: "Follow the festive brand kit. Deliver 9:16 and 1:1 versions with a clear product shot.", updatedAt: 90, submittedAt: "Today, 09:20" },
  { id: "t20", cid: "c4", title: "Diwali gifting reel — 15s, 9:16", module: "Ad Studio", assignee: "dev", due: "2026-10-12", status: "In progress", channels: ["instagram", "youtube"], priority: "High", description: "Follow the festive brand kit. Deliver 9:16 and 1:1 versions with a clear product shot.", updatedAt: 89 },
  { id: "t21", cid: "c4", title: "Gift guide article: 10 picks", module: "Content", assignee: "dev", due: "2026-10-11", status: "In review", channels: ["linkedin"], priority: "Medium", description: "Write in the Herbal Care brand voice. Keep within channel limits and give two call-to-action options.", updatedAt: 88, submittedAt: "Yesterday" },
  { id: "t23", cid: "c4", title: "Schedule the Diwali reel", module: "Library", assignee: "nikhil", due: "2026-10-14", status: "Ready to publish", channels: ["youtube"], priority: "Medium", description: "Use the approved asset from the Library and post it at the scheduled time.", updatedAt: 87 },
  { id: "t26", cid: "c5", title: "Schedule teaser 1", module: "Library", assignee: "nikhil", due: "2026-11-03", status: "To do", channels: ["instagram"], priority: "Low", description: "Use the approved asset from the Library and post it at the scheduled time.", updatedAt: 86 },
  { id: "t28", cid: "c6", title: "Brand voice pass", module: "Branding", assignee: "aisha", due: "2026-11-20", status: "To do", channels: [], priority: "Low", description: "Keep the tone warm, natural and clear. Share a short before/after.", updatedAt: 85 },
];

export const SCHEDULED: ScheduledPost[] = [
  { id: "s1", cid: "c2", date: "2026-09-25", time: "09:00", title: "Teaser 1 — Instagram", caption: "Psst — something new is growing at Herbal Care. #launchweek", channels: ["instagram"], owner: "nikhil", status: "Scheduled", taskId: "t6", assetId: "as3" },
  { id: "s2", cid: "c1", date: "2026-09-26", time: "11:30", title: "Festive carousel", caption: "Gentle care, festive glow. Swipe through the festive range →", channels: ["instagram", "facebook"], owner: "nikhil", status: "Scheduled", taskId: "t4", assetId: "as1" },
  { id: "s3", cid: "c1", date: "2026-09-29", time: "08:00", title: "Drop announcement", caption: "The festive drop is live. Natural gifts for the people who matter most.", channels: ["linkedin"], owner: "nikhil", status: "Paused" },
  { id: "s4", cid: "c1", date: "2026-09-23", time: "18:00", title: "Festive countdown story", caption: "3 days to the festive drop!", channels: ["instagram"], owner: "nikhil", status: "Failed", note: "Instagram connection expired (demo). Retry or reschedule." },
  { id: "s20", cid: "c4", date: "2026-10-14", time: "18:00", title: "Diwali reel — YouTube", caption: "Light up Diwali with our gift sets.", channels: ["youtube"], owner: "nikhil", status: "Scheduled", taskId: "t23", assetId: "as4" },
  { id: "s21", cid: "c8", date: "2026-10-05", time: "18:00", title: "Creator reel #1", caption: "Our first creator collab is here.", channels: ["instagram"], owner: "nikhil", status: "Scheduled" },
  { id: "s22", cid: "c7", date: "2026-08-28", time: "10:00", title: "Sale recap", caption: "Thank you for a sunny summer sale!", channels: ["instagram"], owner: "nikhil", status: "Published" },
  { id: "s23", cid: "c2", date: "2026-09-22", time: "09:00", title: "Launch week save-the-date", caption: "Mark your calendars: launch week starts 25 Sep.", channels: ["instagram", "linkedin"], owner: "nikhil", status: "Published" },
];

export const BRAND_SEED: BrandSettings = {
  name: "Herbal Care",
  tagline: "Rooted in nature. Made for you.",
  colors: [
    { label: "Deep teal", hex: "#0E2E31" },
    { label: "Primary teal", hex: "#186368" },
    { label: "Secondary teal", hex: "#1D7A80" },
    { label: "Soft teal", hex: "#E7F2F1" },
    { label: "Rust orange", hex: "#C05A2C" },
  ],
  defaultVoice: "hc-core",
  defaultTone: "Warm",
  avoidWords: "cheap, chemical",
  hashtags: "#herbalcare",
};

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

const draftBase = { cta: "", ratio: "1:1", platform: "Instagram Feed", duration: "15s", variant: 0 } as const;
export const DRAFTS: Draft[] = [
  {
    ...draftBase, id: "d1", kind: "content", type: "blog", title: "Gift guide: 10 festive picks under ₹999",
    body: "From our garden to your home: the festive gifting season is here.\n\nEvery pick in this guide is gentle, natural and wrapped with care — perfect for the people who matter most.\n\n## What makes it different\n- Natural ingredients\n- Under ₹999\n- Ready to gift\n\nCelebrate the season, naturally.",
    tone: "Warm", voiceId: "hc-festive", length: "Medium", channel: "pinterest", topic: "festive gift picks under ₹999", keywords: "natural ingredients, under ₹999, ready to gift",
    cid: "c1", taskId: "t9", owner: "dev", status: "Draft", updatedAt: 90,
  },
  {
    ...draftBase, id: "d2", kind: "ad", type: "imagead", title: "Gentle care, festive glow", cta: "Shop now",
    body: "From our garden to your home: the festive range — natural ingredients with a gentle touch. Made with love, for you and yours.",
    tone: "Warm", voiceId: "hc-festive", length: "Short", channel: "instagram", topic: "the festive range", keywords: "natural ingredients, festive gifting",
    cid: "c1", taskId: "t3", owner: "dev", status: "Draft", updatedAt: 89,
  },
  {
    ...draftBase, id: "d3", kind: "content", type: "post", title: "Launch teaser — day 1",
    body: "Psst — something new is growing at Herbal Care. Your shelf called. It wants this.\n\n#launchweek #naturalcare #comingsoon",
    tone: "Playful", voiceId: "launch", length: "Short", channel: "instagram", topic: "launch week teaser", keywords: "launch week, natural care, coming soon",
    cid: "c2", taskId: null, owner: "aisha", status: "Approved", updatedAt: 88,
  },
];

export const LIBRARY: Asset[] = [
  { id: "lib1", name: "Herbal Care logo pack", kind: "doc", addedBy: "rohi" },
  { id: "lib2", name: "Product flat-lay photos", kind: "image", addedBy: "aisha" },
  { id: "lib3", name: "Brand film — 30s cut", kind: "video", addedBy: "aisha" },
];

export const FAVORITES: string[] = ["as1"];

export const REVIEWS: Review[] = [
  { id: "r1", kind: "task", itemId: "t8", action: "submitted", by: "dev", note: "", at: "Yesterday", order: 1 },
  { id: "r2", kind: "task", itemId: "t8", action: "rejected", by: "aisha", note: "Descriptions are too long for Pinterest — keep each under 60 words and lead with the hero ingredient.", at: "Today, 09:40", order: 2 },
  { id: "r3", kind: "task", itemId: "t10", action: "submitted", by: "dev", note: "", at: "2 days ago", order: 3 },
  { id: "r4", kind: "task", itemId: "t10", action: "approved", by: "aisha", note: "Great landing copy — approved.", at: "2 days ago", order: 4 },
  { id: "r5", kind: "draft", itemId: "d3", action: "approved", by: "rohi", note: "Fun teaser, approved for day 1.", at: "Yesterday", order: 5 },
  { id: "r6", kind: "task", itemId: "t21", action: "submitted", by: "dev", note: "", at: "Yesterday", order: 6 },
  { id: "r7", kind: "task", itemId: "t7", action: "submitted", by: "dev", note: "", at: "Today, 09:20", order: 7 },
  { id: "r8", kind: "task", itemId: "t1", action: "submitted", by: "dev", note: "", at: "Today, 10:12", order: 8 },
];
