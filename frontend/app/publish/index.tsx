// Publishing: month calendar + scheduled-post list with demo publishing statuses.
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fab, NoAccess, Segmented, StackHeader } from "@/src/components/form";
import { Card, ChannelDots, EmptyState, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { can, moduleLabel } from "@/src/config/roles";
import { DEMO_TODAY } from "@/src/data/mock";
import { campaignById, format12, formatDate, visiblePosts } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { ScheduledPost } from "@/src/types";

type Filter = "upcoming" | "Published" | "Failed" | "Paused" | "all";
const FILTERS: { key: Filter; label: string; match: (s: ScheduledPost) => boolean }[] = [
  { key: "upcoming", label: "Upcoming", match: (s) => s.status === "Scheduled" || s.status === "Publishing" },
  { key: "Paused", label: "Paused", match: (s) => s.status === "Paused" },
  { key: "Failed", label: "Failed", match: (s) => s.status === "Failed" },
  { key: "Published", label: "Published", match: (s) => s.status === "Published" },
  { key: "all", label: "All", match: () => true },
];
const pad = (n: number) => String(n).padStart(2, "0");

export default function Publish() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db } = useDb();
  const { role } = useDemo();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [day, setDay] = useState(DEMO_TODAY);
  const [ym, setYm] = useState({ y: Number(DEMO_TODAY.slice(0, 4)), m: Number(DEMO_TODAY.slice(5, 7)) - 1 });
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (!can.publish(role)) return <NoAccess message="Publishing is handled by Publishers, Super Admins and Owner/Admins." onBack={back} />;

  const posts = visiblePosts(db, role);
  const byDay = posts.reduce<Record<string, ScheduledPost[]>>((m, s) => ({ ...m, [s.date]: [...(m[s.date] ?? []), s] }), {});

  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) => setYm(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const monthCount = posts.filter((s) => s.date.startsWith(`${ym.y}-${pad(ym.m + 1)}`)).length;

  const list = view === "calendar" ? byDay[day] ?? [] : posts.filter(FILTERS.find((f) => f.key === filter)!.match);
  const shown = view === "list" && filter === "Published" ? [...list].reverse() : list;

  const Row = ({ s, last }: { s: ScheduledPost; last: boolean }) => (
    <PressableScale testID={`post-row-${s.id}`} onPress={() => router.push(`/publish/${s.id}` as Href)} style={[styles.row, !last && styles.divider]} scaleTo={0.985}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{formatDate(s.date).split(" ")[0]}</Text>
        <Text style={styles.dateMon}>{formatDate(s.date).split(" ")[1]}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{s.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {format12(s.time)} · {campaignById(db, s.cid)?.name ?? "No campaign"}
        </Text>
        <View style={styles.inline}>
          <Pill label={s.status} tone={statusTone(s.status)} testID={`post-status-${s.id}`} />
          <ChannelDots ids={s.channels} />
        </View>
      </View>
      <Icon name="chevron-forward" size={14} color={colors.muted} />
    </PressableScale>
  );

  return (
    <View style={styles.root} testID="publish-screen">
      <StackHeader title={moduleLabel("publish", role)} onBack={back} />
      <View style={styles.bar}>
        <Segmented testIDPrefix="publish-view" value={view} onChange={setView} options={[{ key: "calendar", label: "Calendar" }, { key: "list", label: "List" }]} />
        <View style={styles.demo} testID="publish-demo-note">
          <Icon name="flask-outline" size={13} color={colors.warning} />
          <Text style={styles.demoText}>Demo publishing — nothing is posted to real social accounts.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        {view === "calendar" ? (
          <Card style={styles.cal} testID="publish-calendar">
            <View style={styles.calHead}>
              <Pressable testID="publish-cal-prev" onPress={() => shift(-1)} style={styles.calNav} accessibilityLabel="Previous month">
                <Icon name="chevron-back" size={16} color={colors.onSurface} />
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.calTitle} testID="publish-cal-title">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</Text>
                <Text style={styles.meta}>{monthCount} post{monthCount === 1 ? "" : "s"}</Text>
              </View>
              <Pressable testID="publish-cal-next" onPress={() => shift(1)} style={styles.calNav} accessibilityLabel="Next month">
                <Icon name="chevron-forward" size={16} color={colors.onSurface} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <Text key={`h${i}`} style={styles.dow}>{d}</Text>
              ))}
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
                const on = iso === day;
                const items = byDay[iso] ?? [];
                return (
                  <Pressable key={i} testID={`publish-day-${iso}`} onPress={() => setDay(iso)} style={styles.cell} accessibilityLabel={`${iso}, ${items.length} posts`}>
                    <View style={[styles.day, iso === DEMO_TODAY && styles.today, on && styles.dayOn]}>
                      <Text style={[styles.dayText, on && { color: colors.onBrandPrimary, fontWeight: "700" }]}>{d}</Text>
                    </View>
                    <View style={styles.dots}>
                      {items.slice(0, 3).map((s) => (
                        <View key={s.id} style={[styles.dot, { backgroundColor: s.status === "Failed" ? colors.error : s.status === "Published" ? colors.success : s.status === "Paused" ? colors.muted : colors.brandPrimary }]} />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.legend}>
              {([["Scheduled", colors.brandPrimary], ["Published", colors.success], ["Paused", colors.muted], ["Failed", colors.error]] as const).map(([l, c]) => (
                <View key={l} style={styles.inline}>
                  <View style={[styles.dot, { backgroundColor: c }]} />
                  <Text style={styles.meta}>{l}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.map((f) => {
              const on = f.key === filter;
              return (
                <PressableScale key={f.key} testID={`publish-filter-${f.key}`} onPress={() => setFilter(f.key)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label} {posts.filter(f.match).length}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.section} testID="publish-list-title">
          {view === "calendar" ? (day === DEMO_TODAY ? `Today · ${formatDate(day)}` : new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })) : `${FILTERS.find((f) => f.key === filter)!.label} posts`}
        </Text>
        <Card testID="publish-list">
          {shown.length ? (
            shown.map((s, i) => <Row key={s.id} s={s} last={i === shown.length - 1} />)
          ) : (
            <EmptyState testID="publish-empty" icon="calendar-outline" title={view === "calendar" ? "Nothing on this day" : "No posts here"} message={view === "calendar" ? "Pick another day or schedule a post for this one." : "Posts with this status will show up here."} />
          )}
        </Card>
      </ScrollView>
      <Fab testID="publish-new-button" label="Schedule post" icon="add" bottom={insets.bottom + spacing.lg} onPress={() => router.push((view === "calendar" && day >= DEMO_TODAY ? `/publish/edit?date=${day}` : "/publish/edit") as Href)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  bar: { padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  demo: { flexDirection: "row", alignItems: "center", gap: 6 },
  demoText: { flex: 1, fontSize: fontSize.sm, color: c.warning },
  cal: { padding: spacing.md },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  calNav: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.neutralSoft },
  calTitle: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dow: { width: "14.2857%", textAlign: "center", fontSize: fontSize.sm, color: c.muted, fontWeight: "600", paddingVertical: 4 },
  cell: { width: "14.2857%", height: 48, alignItems: "center", justifyContent: "flex-start", paddingTop: 2 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  today: { borderWidth: 1, borderColor: c.brand },
  dayOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  dayText: { fontSize: fontSize.base, color: c.onSurface },
  dots: { flexDirection: "row", gap: 2, height: 8, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.divider },
  chips: { gap: spacing.sm, paddingBottom: spacing.xs },
  chip: { height: 44, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base - 1, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onSurfaceInverse },
  section: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dateBox: { width: 46, height: 50, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  dateDay: { fontSize: fontSize.lg + 2, fontWeight: "800", color: c.onBrandTertiary },
  dateMon: { fontSize: fontSize.sm - 1, fontWeight: "700", color: c.onBrandTertiary, textTransform: "uppercase" },
}));
