// Content Studio + Ad Studio options (from the ProfileVoice web workspace).
import { BRAND_SEED } from "@/src/data/mock";
import type { AdType, BrandSettings, BrandVoice, ContentType } from "@/src/types";

export interface StudioType<T extends string> {
  id: T;
  label: string;
  hint: string;
  icon: string;
}

export const CONTENT_TYPES: StudioType<ContentType>[] = [
  { id: "blog", label: "Blog post", hint: "Long-form post for your site", icon: "reader-outline" },
  { id: "web", label: "Website copy", hint: "Landing page, hero and sections", icon: "browsers-outline" },
  { id: "article", label: "Article", hint: "Guide or thought-leadership", icon: "newspaper-outline" },
  { id: "product", label: "Brand-product description", hint: "Product copy and key features", icon: "pricetag-outline" },
  { id: "post", label: "Social post", hint: "Caption or update for a channel", icon: "chatbubble-ellipses-outline" },
];

export const AD_TYPES: StudioType<AdType>[] = [
  { id: "imagead", label: "Image ad", hint: "Static creative, headline & CTA", icon: "image-outline" },
  { id: "videoad", label: "Video ad", hint: "Short video storyboard", icon: "videocam-outline" },
  { id: "adscript", label: "Ad script", hint: "Hooks, voiceover, on-screen text", icon: "chatbox-ellipses-outline" },
];

export const TONES = ["Friendly", "Professional", "Playful", "Bold", "Warm", "Premium", "Persuasive", "Witty"];

export const VOICE_SEED: BrandVoice[] = [
  { id: "hc-core", name: "Herbal Care — Core", trait: "Warm, natural, plain words", signoff: "Rooted in nature. Made for you." },
  { id: "hc-festive", name: "Herbal Care — Festive", trait: "Celebratory, generous, family-first", signoff: "Celebrate the season, naturally." },
  { id: "launch", name: "Launch sub-brand", trait: "Bold, modern, curious", signoff: "New. Natural. Now." },
];

/** Live brand voices + preferences. The data store keeps these in sync with Branding edits. */
export const VOICES: BrandVoice[] = VOICE_SEED.map((v) => ({ ...v }));
export const BRAND: BrandSettings = { ...BRAND_SEED, colors: [...BRAND_SEED.colors] };

export const LENGTHS = ["Short", "Medium", "Long"] as const;
export const RATIOS: [string, string][] = [["1:1", "Square 1:1"], ["4:5", "Portrait 4:5"], ["9:16", "Story 9:16"], ["16:9", "Landscape 16:9"]];
export const PLATFORMS = ["Instagram Feed", "Instagram Reels", "Facebook", "YouTube Shorts", "LinkedIn"];
export const DURATIONS = ["6s", "15s", "30s"];
export const CTAS = ["Shop now", "Learn more", "Get offer", "Order today"];

export const studioType = (id: string) => [...CONTENT_TYPES, ...AD_TYPES].find((t) => t.id === id) as StudioType<string> | undefined;

/** Character guidance shown under the body field. */
export function charLimit(type: string, channel: string): { limit: number; label: string } | null {
  if (type === "post") return channel === "x" ? { limit: 280, label: "X limit" } : { limit: 2200, label: "Caption limit" };
  if (type === "imagead") return { limit: 125, label: "Recommended primary text" };
  return null;
}
