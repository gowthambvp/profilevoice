// Content Studio (/studio/content) and Ad Studio (/studio/ads): start a new draft or open one.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NoAccess, SearchBar, StackHeader } from "@/src/components/form";
import { Card, EmptyState, Icon, Pill, PressableScale, SectionHeader, statusTone } from "@/src/components/ui";
import { can, isManager } from "@/src/config/roles";
import { AD_TYPES, CONTENT_TYPES, studioType } from "@/src/config/studio";
import { campaignById, draftsFor, person } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, shadow1, spacing, useTheme } from "@/src/theme";
import type { DraftStatus } from "@/src/types";

const FILTERS: ("All" | DraftStatus)[] = ["All", "Draft", "In review", "Changes requested", "Approved"];

export default function StudioHome() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { kind: kParam } = useLocalSearchParams<{ kind: string }>();
  const { db } = useDb();
  const { role } = useDemo();
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  if (!role) return <Redirect href="/" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  const ad = kParam === "ads";
  const title = ad ? "Ad Studio" : "Content Studio";
  if (!can.useStudio(role)) return <NoAccess message={`Publishers schedule approved work. ${title} is used by Creators and managers.`} onBack={back} />;

  const types = ad ? AD_TYPES : CONTENT_TYPES;
  const manager = isManager(role);
  const q = query.trim().toLowerCase();
  const all = draftsFor(db, role, ad ? "ad" : "content").filter((d) => !q || d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q));
  const list = filter === "All" ? all : all.filter((d) => d.status === filter);

  return (
    <View style={styles.root} testID={`studio-screen-${ad ? "ads" : "content"}`}>
      <StackHeader title={title} onBack={back} />
      <View style={styles.sticky}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SearchBar testID="studio-search-input" value={query} onChangeText={setQuery} placeholder="Search drafts" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {FILTERS.map((f) => {
            const on = f === filter;
            const count = f === "All" ? all.length : all.filter((d) => d.status === f).length;
            return (
              <PressableScale key={f} testID={`studio-filter-${f.toLowerCase().replace(/ /g, "-")}`} onPress={() => setFilter(f)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f} {count}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Animated.View entering={FadeInDown.duration(320)}>
          <Text style={styles.sectionLabel}>Start something new</Text>
          <View style={styles.grid}>
            {types.map((t, i) => (
              <PressableScale key={t.id} testID={`studio-new-${t.id}`} onPress={() => router.push(`/studio/editor?kind=${ad ? "ads" : "content"}&type=${t.id}` as Href)} style={styles.typeCard}>
                <View style={[styles.typeIcon, i === 0 && { backgroundColor: colors.brandPrimary }]}>
                  <Icon name={t.icon} size={17} color={i === 0 ? colors.onBrandPrimary : colors.brand} />
                </View>
                <Text style={styles.typeLabel} numberOfLines={2}>
                  {t.label}
                </Text>
                <Text style={styles.typeHint} numberOfLines={2}>
                  {t.hint}
                </Text>
              </PressableScale>
            ))}
          </View>
          <View style={styles.demoNote}>
            <Icon name="flask-outline" size={13} color={colors.muted} />
            <Text style={styles.demoText}>Drafts are generated locally from templates — no AI service is used.</Text>
          </View>
        </Animated.View>

        <SectionHeader title={`${manager ? "All drafts" : "Your drafts"} (${list.length})`} />
        <Card testID="studio-drafts-list">
          {list.length ? (
            list.map((d, i) => {
              const camp = campaignById(db, d.cid);
              const type = studioType(d.type);
              return (
                <PressableScale key={d.id} testID={`draft-row-${d.id}`} onPress={() => router.push(`/studio/editor?id=${d.id}` as Href)} style={[styles.row, i < list.length - 1 && styles.divider]} scaleTo={0.985}>
                  <View style={styles.rowIcon}>
                    <Icon name={type?.icon ?? "document-outline"} size={15} color={colors.brand} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {d.title || "Untitled draft"}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {[type?.label, camp?.name ?? "No campaign", manager ? person(d.owner).name : null].filter(Boolean).join(" · ")}
                    </Text>
                    <Pill label={d.status} tone={statusTone(d.status)} />
                  </View>
                  <Icon name="chevron-forward" size={14} color={colors.muted} />
                </PressableScale>
              );
            })
          ) : (
            <EmptyState testID="studio-drafts-empty" icon="document-text-outline" title={q || filter !== "All" ? "No matching drafts" : "No drafts yet"} message="Pick a format above to create your first draft." />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  sticky: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingTop: spacing.md },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  chip: { height: 36, flexShrink: 0, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base - 1, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onSurfaceInverse },
  sectionLabel: { fontSize: fontSize.lg + 1, fontWeight: "700", color: c.onSurface, marginBottom: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  typeCard: { flexBasis: "47%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, minHeight: 112, ...shadow1(c) },
  typeIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  typeLabel: { fontSize: fontSize.base + 1, fontWeight: "700", color: c.onSurface },
  typeHint: { fontSize: fontSize.sm, color: c.muted, marginTop: 2, lineHeight: 16 },
  demoNote: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: spacing.md },
  demoText: { flex: 1, fontSize: fontSize.sm, color: c.muted },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  rowIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface },
  rowMeta: { fontSize: fontSize.sm + 1, color: c.muted },
}));
