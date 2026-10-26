// LOCAL template-based demo generator. No AI service is called — copy is assembled
// from tone phrase banks, the chosen brand voice and the brief. "Regenerate" bumps
// `variant` to rotate through phrasings.
import { AD_TYPES, CONTENT_TYPES, CTAS, VOICES } from "@/src/config/studio";
import type { DraftInput, Task } from "@/src/types";

type Gen = Pick<DraftInput, "type" | "tone" | "voiceId" | "length" | "channel" | "platform" | "duration" | "topic" | "keywords" | "variant">;

const pick = <T,>(a: T[], v: number, o = 0) => a[(v + o) % a.length];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a" / "an" before a word */
const an = (w: string) => `${/^[aeiou]/i.test(w) ? "an" : "a"} ${w}`;
/** Shorten at a word boundary, never mid-word. */
const clip = (s: string, n: number) => {
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > n / 2 ? cut.slice(0, at) : cut).replace(/[\s,;:—-]+$/, "")}…`;
};

const TONE: Record<string, { open: string[]; adj: string[]; close: string[] }> = {
  Friendly: { open: ["Say hello to", "Meet", "Here’s something you’ll love:"], adj: ["easy", "feel-good", "everyday"], close: ["Give it a try — we think you’ll love it.", "Tell us what you think!"] },
  Professional: { open: ["Introducing", "Discover", "We’re pleased to present"], adj: ["reliable", "carefully tested", "thoughtfully made"], close: ["Learn more on our website.", "Explore the full range today."] },
  Playful: { open: ["Psst —", "Guess what?", "Plot twist:"], adj: ["ridiculously good", "happy-making", "magical"], close: ["Go on, treat yourself.", "Your shelf called. It wants this."] },
  Bold: { open: ["This is", "Stop scrolling:", "Meet the new standard:"], adj: ["powerful", "uncompromising", "next-level"], close: ["Don’t settle. Get yours now.", "Make the switch today."] },
  Warm: { open: ["Made with care:", "From our garden to your home:", "A little kindness, bottled:"], adj: ["gentle", "comforting", "soothing"], close: ["Made with love, for you and yours.", "Take a moment for yourself."] },
  Premium: { open: ["Crafted for those who notice:", "The art of", "Refined and rare:"], adj: ["luxurious", "small-batch", "exquisite"], close: ["Indulge in the exceptional.", "Reserved for the discerning."] },
  Persuasive: { open: ["Here’s why thousands switched to", "You deserve", "The smarter choice:"], adj: ["proven", "results-driven", "trusted"], close: ["Order today and feel the difference.", "Try it this week and see."] },
  Witty: { open: ["Breaking news:", "Fun fact:", "Not to brag, but"], adj: ["suspiciously good", "clever", "low-key iconic"], close: ["You’re welcome.", "Consider this your sign."] },
};

const MIDDLE: ((t: string, a: string, k: string[]) => string)[] = [
  (t, a, k) => `${cap(t)} brings together ${k[0]} and ${a} care, so every routine feels a little more special.`,
  (t, a, k) => `We started with one question: how do we make ${k[1] ?? k[0]} simple? The answer became ${t}.`,
  (t, a) => `Each detail is ${a} — from what goes in to how it arrives at your door.`,
  (t, a, k) => `Customers tell us it’s the ${k[k.length - 1]} they didn’t know they needed.`,
  (t, a) => `Pair it with the rest of the range for ${an(a)} ritual that lasts all season.`,
];
const PARAS = { Short: 1, Medium: 3, Long: 5 } as const;

const keywords = (g: Gen) => {
  const list = g.keywords.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : ["natural ingredients", "everyday care", "festive gifting"];
};
const topicOf = (g: Gen) => g.topic.trim() || "the Herbal Care festive range";
const setup = (g: Gen) => {
  const tone = TONE[g.tone] ?? TONE.Friendly;
  const v = g.variant;
  return {
    t: topicOf(g),
    k: keywords(g),
    v,
    a: pick(tone.adj, v),
    open: pick(tone.open, v),
    close: pick(tone.close, v),
    voice: VOICES.find((x) => x.id === g.voiceId) ?? VOICES[0],
  };
};

export function generateContent(g: Gen): { title: string; body: string } {
  const { t, k, v, a, open, close, voice } = setup(g);
  const middles = Array.from({ length: PARAS[g.length] }, (_, i) => pick(MIDDLE, v, i)(t, a, k));
  const bullets = k.map((x) => `- ${cap(x)}`);
  switch (g.type) {
    case "post": {
      const tags = k.slice(0, 3).map((x) => `#${x.replace(/[^a-z0-9]/gi, "").toLowerCase()}`).join(" ");
      const line =
        g.length === "Short" ? `${open} ${t}. ${close}` : `${open} ${t} — ${a}, ${k[0]} and made for you.${g.length === "Long" ? ` ${middles[0]}` : ""} ${close}`;
      const lead = g.channel === "linkedin" ? `${line}\n\nWhat’s your take? Share below.` : g.channel === "x" ? clip(line, 220) : line;
      return { title: clip(pick([cap(t), `${open} ${t}`, `${cap(a)} ${t}`], v), 60), body: `${lead}\n\n${tags}` };
    }
    case "product":
      return { title: cap(t), body: [`${open} ${t}: ${an(a)} essential for ${k[0]}.`, "", ...middles.slice(0, Math.max(1, middles.length - 1)), "", "## Key features", ...bullets, "", voice.signoff].join("\n") };
    case "web":
      return {
        title: `${open} ${t}`,
        body: [`# ${open} ${t}`, `${cap(a)} care — ${voice.trait.toLowerCase()}.`, "", "## Why you’ll love it", ...bullets, "", "## How it works", ...middles, "", `## ${close}`, "Shop the collection →"].join("\n"),
      };
    default: {
      const titles = [`${cap(t)}: ${a} care, made simple`, `Why ${t} belongs in your routine`, `${k.length} reasons to love ${t}`];
      const body = [
        `${open} ${t}.`,
        "",
        ...middles.flatMap((m) => [m, ""]),
        "## What makes it different",
        ...bullets,
        "",
        ...(g.type === "article" ? ["## The takeaway", `${cap(t)} is proof that ${k[0]} and ${a} design can go hand in hand.`, ""] : []),
        `${close} ${voice.signoff}`,
      ];
      return { title: pick(titles, v), body: body.join("\n") };
    }
  }
}

const SCENES: ((t: string, a: string, k: string[]) => string)[] = [
  (t) => `Hook — close-up, hands opening ${t}. Text: “Wait for it…”`,
  (t, a) => `Reveal — product in soft daylight, ${a} mood.`,
  (t, a, k) => `Benefit — ${k[0]} called out on screen.`,
  (t, a, k) => `Proof — a happy customer moment; ${k[1] ?? k[0]}.`,
  () => `Lifestyle — the ritual at home, family in frame.`,
  () => `Logo + offer — brand lockup with CTA.`,
];

export function generateAd(g: Gen): { title: string; body: string; cta: string } {
  const { t, k, v, a, open, close, voice } = setup(g);
  const cta = pick(CTAS, v);
  const options = [`${cap(a)} care, naturally`, cap(t), `${cap(t)}, made ${a}`].filter((h) => h.length <= 40);
  const headline = options.length ? pick(options, v) : `${cap(a)} care, naturally`;
  if (g.type === "videoad") {
    const total = parseInt(g.duration, 10) || 15;
    const n = total <= 6 ? 2 : total <= 15 ? 4 : 6;
    const step = total / n;
    const scenes = Array.from({ length: n }, (_, i) => {
      const scene = i === n - 1 ? SCENES[SCENES.length - 1] : pick(SCENES.slice(0, -1), v, i);
      return `- ${Math.round(i * step)}–${Math.round((i + 1) * step)}s: ${scene(t, a, k)}`;
    });
    return { title: headline, body: [`## Storyboard · ${total}s · ${g.platform}`, ...scenes, "", "## Voiceover", `${open} ${t}. ${close}`, "", voice.signoff].join("\n"), cta };
  }
  if (g.type === "adscript") {
    const hooks = [`Ever tried ${t}?`, `The ${a} secret behind ${k[0]}.`, `3 seconds. One reason to try ${t}.`, `${cap(k[0])} — without the compromise.`];
    return {
      title: headline,
      body: [
        `## Hook options (${g.platform})`,
        ...[0, 1, 2].map((i) => `- ${pick(hooks, v, i)}`),
        "",
        "## Voiceover",
        `${open} ${t}. ${pick(MIDDLE, v)(t, a, k)} ${close}`,
        "",
        "## On-screen text",
        ...k.slice(0, 3).map((x) => `- ${cap(x)}`),
        `- ${cta}`,
      ].join("\n"),
      cta,
    };
  }
  const base = `${open} ${t} — ${k[0]} with ${an(a)} touch.`;
  const body = `${base} ${close}`.length <= 125 ? `${base} ${close}` : base.length <= 125 ? base : `${cap(k[0])} with ${an(a)} touch. ${close}`;
  return { title: headline, body: clip(body, 125), cta };
}

function guessType(kind: "content" | "ad", task?: Task): string {
  const s = task?.title.toLowerCase() ?? "";
  if (kind === "ad") return s.includes("video") || s.includes("reel") ? "videoad" : s.includes("hook") || s.includes("script") ? "adscript" : "imagead";
  if (s.includes("description")) return "product";
  if (s.includes("article") || s.includes("guide")) return "article";
  if (s.includes("landing") || s.includes("website")) return "web";
  if (s.includes("post") || s.includes("caption") || s.includes("email")) return s.includes("blog") ? "blog" : "post";
  return "blog";
}

export function blankDraft(kind: "content" | "ad", type: string | undefined, cid: string | null, task?: Task): DraftInput {
  const valid = (kind === "ad" ? AD_TYPES : CONTENT_TYPES).some((x) => x.id === type);
  const t = (valid ? type : guessType(kind, task)) as DraftInput["type"];
  return {
    kind,
    type: t,
    title: "",
    body: "",
    cta: kind === "ad" ? "Shop now" : "",
    tone: "Warm",
    voiceId: "hc-core",
    length: "Medium",
    channel: task?.channels[0] ?? "instagram",
    ratio: t === "videoad" ? "9:16" : "1:1",
    platform: t === "videoad" || t === "adscript" ? "Instagram Reels" : "Instagram Feed",
    duration: "15s",
    topic: "",
    keywords: "",
    cid,
    taskId: task?.id ?? null,
    variant: 0,
  };
}
