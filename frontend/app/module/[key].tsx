// Temporary destination for modules planned in later phases. Always offers a Back action.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, ChannelDots, EmptyState, Icon, Pill, PressableScale, SectionHeader } from "@/src/components/ui";
import { DESTINATIONS } from "@/src/config/modules";
import { moduleLabel } from "@/src/config/roles";
import { format12, formatDate, pendingApprovals, person, upcomingScheduled } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { ModuleKey } from "@/src/types";

export default function ModulePlaceholder() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { role, config } = useDemo();
  const { db } = useDb();
  if (!role) return <Redirect href="/" />;

  const dest = DESTINATIONS[key] ?? { key, title: "Coming soon", icon: "construct-outline", description: "This screen is planned for a later phase.", phase: "Planned for a later phase" };
  const title = key in DESTINATIONS && ["approvals", "publish"].includes(key) ? moduleLabel(key as ModuleKey, role) : dest.title;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  const approvals = key === "approvals" ? pendingApprovals(db, role) : [];
  const scheduled = key === "publish" ? upcomingScheduled(db, role) : [];

  return (
    <View style={styles.root} testID={`placeholder-screen-${key}`}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale testID="placeholder-back-button" accessibilityLabel="Back" onPress={back} style={styles.backBtn} scaleTo={0.92}>
          <Icon name="chevron-back" size={19} color={colors.onSurface} />
        </PressableScale>
        <Text style={styles.headerTitle} numberOfLines={1} testID="placeholder-title">
          {title}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon name={dest.icon} size={24} color={colors.onSurfaceInverse} />
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroDesc}>{dest.description}</Text>
            <View style={styles.phase} testID="placeholder-phase-note">
              <Icon name="construct-outline" size={12} color={colors.onBrandTertiary} />
              <Text style={styles.phaseText}>{dest.phase} · preview only</Text>
            </View>
          </Card>
        </Animated.View>

        {key === "approvals" ? (
          <>
            <SectionHeader title={role === "editor" ? "Your work awaiting approval" : "Waiting on a decision"} />
            <Card testID="approvals-preview">
              {approvals.length ? (
                approvals.map((a, i) => (
                  <PressableScale key={a.id} testID={`approval-row-${a.id}`} onPress={() => router.push(`/task/${a.id}` as Href)} style={[styles.row, i < approvals.length - 1 && styles.divider]} scaleTo={0.985}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.title}</Text>
                      <Text style={styles.rowMeta}>
                        {a.module} · from {person(a.assignee).name} · {a.submittedAt ?? "Recently"}
                      </Text>
                    </View>
                    <Pill label="Pending" tone="warning" />
                  </PressableScale>
                ))
              ) : (
                <EmptyState icon="checkmark-done-outline" title="Nothing to review" message="New submissions will show up here." />
              )}
            </Card>
          </>
        ) : null}

        {key === "publish" ? (
          <>
            <SectionHeader title="Upcoming posts" />
            <Card testID="schedule-preview">
              {scheduled.length ? (
                scheduled.map((s, i) => (
                  <View key={s.id} style={[styles.row, i < scheduled.length - 1 && styles.divider]}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{formatDate(s.date).split(" ")[0]}</Text>
                      <Text style={styles.dateMon}>{formatDate(s.date).split(" ")[1]}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.rowTitle}>{s.title}</Text>
                      <Text style={styles.rowMeta}>{format12(s.time)}</Text>
                    </View>
                    <ChannelDots ids={s.channels} />
                  </View>
                ))
              ) : (
                <EmptyState icon="calendar-outline" title="Queue is empty" message="Approved work scheduled to go live will appear here." />
              )}
            </Card>
          </>
        ) : null}

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button testID="placeholder-back-primary" label="Back" icon="arrow-back" onPress={back} />
          <Button testID="placeholder-home-button" label="Go to Home" variant="secondary" onPress={() => router.dismissTo("/home")} />
        </View>
        <Text style={styles.footnote}>Viewing as {config.label} · sample data</Text>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: fontSize.lg + 1, fontWeight: "700", color: c.onSurface },
  hero: { padding: spacing.xl, gap: spacing.sm },
  heroIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  heroTitle: { fontSize: fontSize.xl + 2, fontWeight: "800", color: c.onSurface, letterSpacing: -0.4 },
  heroDesc: { fontSize: fontSize.base + 1, color: c.muted, lineHeight: 21 },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  phase: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: spacing.sm, backgroundColor: c.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  phaseText: { fontSize: fontSize.sm, fontWeight: "600", color: c.onBrandTertiary },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface },
  rowMeta: { fontSize: fontSize.sm + 1, color: c.muted, marginTop: 2 },
  dateBox: { width: 46, height: 50, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  dateDay: { fontSize: fontSize.lg + 2, fontWeight: "800", color: c.onBrandTertiary },
  dateMon: { fontSize: fontSize.sm - 1, fontWeight: "700", color: c.onBrandTertiary, textTransform: "uppercase" },
  footnote: { fontSize: fontSize.sm, color: c.muted, textAlign: "center", marginTop: spacing.lg },
}));
