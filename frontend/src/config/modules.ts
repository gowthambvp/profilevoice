// Registry of every destination the app can open. Destinations not built yet render
// the shared placeholder screen at /module/[key].
import type { Href } from "expo-router";

export type IconName = string;

export interface Destination {
  key: string;
  title: string;
  icon: IconName;
  description: string;
  phase: string;
}

export const DESTINATIONS: Record<string, Destination> = {
  approvals: { key: "approvals", title: "Approvals", icon: "checkmark-done-outline", description: "Review work your Creators sent for approval, approve it or request changes.", phase: "Planned for a later phase" },
  publish: { key: "publish", title: "Schedule queue", icon: "calendar-outline", description: "Approved work waiting to go live, with the date, time and channels for each post.", phase: "Planned for a later phase" },
  content: { key: "content", title: "Content Studio", icon: "document-text-outline", description: "Write articles, posts, emails and brand-product descriptions in your brand voice.", phase: "Planned for a later phase" },
  ads: { key: "ads", title: "Ad Studio", icon: "sparkles-outline", description: "Make image and video ads, scripts and hook variants for each channel.", phase: "Planned for a later phase" },
  branding: { key: "branding", title: "Branding", icon: "color-palette-outline", description: "Brand voices, logos and the brand kit used by every piece of work.", phase: "Planned for a later phase" },
  library: { key: "library", title: "Library", icon: "albums-outline", description: "Every asset made in this workspace, ready to reuse or schedule.", phase: "Planned for a later phase" },
  team: { key: "team", title: "Team", icon: "people-outline", description: "Invite people and set their role on each project.", phase: "Planned for a later phase" },
  billing: { key: "billing", title: "Billing", icon: "card-outline", description: "Plan, seats and invoices for this workspace.", phase: "Planned for a later phase" },
  settings: { key: "settings", title: "Settings", icon: "settings-outline", description: "Workspace details, structure and your preferences.", phase: "Planned for a later phase" },
  notifications: { key: "notifications", title: "Notifications", icon: "notifications-outline", description: "Approvals, comments and schedule updates that need your attention.", phase: "Planned for a later phase" },
  "new-campaign": { key: "new-campaign", title: "Create Campaign", icon: "megaphone-outline", description: "Name the campaign, pick channels and dates, then build the team.", phase: "Planned for a later phase" },
  "request-campaign": { key: "request-campaign", title: "Request a campaign", icon: "paper-plane-outline", description: "Plan it like a campaign, then ask a Super Admin or Owner/Admin to approve it.", phase: "Planned for a later phase" },
  campaign: { key: "campaign", title: "Campaign details", icon: "megaphone-outline", description: "Campaign brief, team, channels and every task inside it.", phase: "Planned for a later phase" },
  task: { key: "task", title: "Task details", icon: "checkbox-outline", description: "Open the work, add comments and send it for approval.", phase: "Planned for a later phase" },
};

export const destinationHref = (key: string, id?: string): Href =>
  (id ? `/module/${key}?id=${id}` : `/module/${key}`) as Href;
