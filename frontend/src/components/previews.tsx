// Visual previews for Content Studio + Ad Studio drafts.
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { Card, EmptyState, Icon, PVLogo } from "@/src/components/ui";
import { CHANNELS, WORKSPACE } from "@/src/data/mock";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { DraftInput } from "@/src/types";

/** Tiny markdown-ish renderer: "# ", "## ", "- " and paragraphs. */
export function RichText({ text }: { text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <View key={i} style={{ height: 4 }} />;
        if (line.startsWith("# ")) return <Text key={i} style={styles.h1}>{line.slice(2)}</Text>;
        if (line.startsWith("## ")) return <Text key={i} style={styles.h2}>{line.slice(3)}</Text>;
        if (line.startsWith("- "))
          return (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.dot, { backgroundColor: colors.brandPrimary }]} />
              <Text style={styles.p}>{line.slice(2)}</Text>
            </View>
          );
        const tags = line.split(/(#[a-z0-9]+)/gi);
        return (
          <Text key={i} style={styles.p}>
            {tags.map((part, j) => (part.startsWith("#") ? <Text key={j} style={{ color: colors.brand, fontWeight: "600" }}>{part}</Text> : part))}
          </Text>
        );
      })}
    </View>
  );
}

function BrandHeader({ sub }: { sub: string }) {
  const styles = useStyles();
  return (
    <View style={styles.brandRow}>
      <PVLogo size={32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.brandName}>{WORKSPACE.project}</Text>
        <Text style={styles.brandSub}>{sub}</Text>
      </View>
    </View>
  );
}

const ratioNum = (r: string) => {
  const [w, h] = r.split(":").map(Number);
  return w && h ? w / h : 1;
};

export function DraftPreview({ draft }: { draft: DraftInput }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (!draft.title.trim() && !draft.body.trim()) {
    return (
      <Card testID="preview-empty">
        <EmptyState icon="eye-outline" title="Nothing to preview yet" message="Generate a draft or start writing in the Write tab." />
      </Card>
    );
  }

  if (draft.type === "post") {
    const ch = CHANNELS[draft.channel];
    return (
      <Card style={styles.pad} testID="preview-post">
        <BrandHeader sub={`${ch?.label ?? "Social"} · Just now`} />
        <RichText text={draft.body} />
        <View style={styles.socialBar}>
          {["heart-outline", "chatbubble-outline", "paper-plane-outline", "bookmark-outline"].map((n) => (
            <Icon key={n} name={n} size={18} color={colors.muted} />
          ))}
        </View>
      </Card>
    );
  }

  if (draft.type === "imagead" || draft.type === "videoad") {
    const r = ratioNum(draft.ratio);
    const video = draft.type === "videoad";
    return (
      <Card style={styles.pad} testID="preview-ad">
        <BrandHeader sub={`Sponsored · ${draft.platform}`} />
        {!video ? <Text style={styles.p}>{draft.body}</Text> : null}
        <View style={[styles.frameWrap, { width: r < 1 ? "72%" : "100%" }]}>
          <LinearGradient colors={[colors.deepTeal, colors.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.frame, { aspectRatio: r }]}>
            <View style={styles.glow} />
            <PVLogo size={28} inverse />
            <View style={{ flex: 1 }} />
            {video ? (
              <View style={styles.play}>
                <Icon name="play" size={22} color={colors.onBrandPrimary} />
              </View>
            ) : null}
            <Text style={styles.frameHeadline} numberOfLines={3} testID="preview-ad-headline">
              {draft.title || "Your headline"}
            </Text>
            <Text style={styles.frameMeta}>{video ? `${draft.duration} · ${draft.ratio}` : draft.ratio}</Text>
          </LinearGradient>
        </View>
        <View style={styles.ctaBar}>
          <Text style={styles.ctaHeadline} numberOfLines={1}>
            {draft.title || "Your headline"}
          </Text>
          <View style={styles.ctaBtn} testID="preview-ad-cta">
            <Text style={styles.ctaText}>{draft.cta || "Learn more"}</Text>
          </View>
        </View>
        {video ? <RichText text={draft.body} /> : null}
      </Card>
    );
  }

  return (
    <Card style={styles.pad} testID="preview-article">
      <Text style={styles.kicker}>{WORKSPACE.project.toUpperCase()}</Text>
      {draft.title ? <Text style={styles.title}>{draft.title}</Text> : null}
      <RichText text={draft.body} />
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  pad: { padding: spacing.lg, gap: spacing.md },
  h1: { fontSize: fontSize.xl + 2, fontWeight: "800", color: c.onSurface, letterSpacing: -0.4 },
  h2: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface, marginTop: spacing.xs },
  p: { fontSize: fontSize.base + 1, color: c.onSurface, lineHeight: 21, flexShrink: 1 },
  bulletRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingRight: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandName: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  brandSub: { fontSize: fontSize.sm, color: c.muted },
  socialBar: { flexDirection: "row", gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.divider },
  frameWrap: { alignSelf: "center", borderRadius: radius.md, overflow: "hidden" },
  frame: { width: "100%", padding: spacing.lg, justifyContent: "flex-end", overflow: "hidden" },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: c.brandPrimary, opacity: 0.25, top: -60, right: -70 },
  play: { alignSelf: "center", width: 52, height: 52, borderRadius: 26, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  frameHeadline: { fontSize: fontSize.xl + 2, fontWeight: "800", color: c.onSurfaceInverse, letterSpacing: -0.4 },
  frameMeta: { fontSize: fontSize.sm, color: c.onSurfaceInverseMuted, marginTop: 4 },
  ctaBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  ctaHeadline: { flex: 1, fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  ctaBtn: { backgroundColor: c.brandPrimary, borderRadius: radius.sm + 2, paddingHorizontal: spacing.md, height: 34, justifyContent: "center" },
  ctaText: { color: c.onBrandPrimary, fontWeight: "700", fontSize: fontSize.sm + 1 },
  kicker: { fontSize: fontSize.sm, fontWeight: "800", color: c.brandPrimary, letterSpacing: 1 },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurface, letterSpacing: -0.5, lineHeight: 28 },
}));
