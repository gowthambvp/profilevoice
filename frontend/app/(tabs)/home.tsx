// Home dashboard. All counts and lists come from src/services/dashboard.ts.
import { useRouter, type Href } from "expo-router";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityRow, CampaignRow, TaskRow } from "@/src/components/rows";
import { Avatar, Card, EmptyState, Icon, PVLogo, PressableScale, SectionHeader } from "@/src/components/ui";
import { destinationHref } from "@/src/config/modules";
import { DEMO_TODAY, WORKSPACE } from "@/src/data/mock";
import { usesNativeTabs } from "@/src/navigation";
import { actionsFor, activityFor, attentionTasks, formatDate, notificationCount, recentCampaigns, summaryCards, type SummaryCard } from "@/src/services/dashboard";
import { useActiveRole, useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, shadow1, spacing, useTheme } from "@/src/theme";

const TARGET: Record<SummaryCard["target"], Href> = {
  campaigns: "/(tabs)/campaigns",
  tasks: "/(tabs)/tasks",
  approvals: destinationHref("approvals"),
  publish: destinationHref("publish"),
};

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { config, user } = useDemo();
  const role = useActiveRole();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const cards = summaryCards(role);
  const actions = actionsFor(config.quickActions);
  const attention = attentionTasks(role).slice(0, 4);
  const campaigns = recentCampaigns(role).slice(0, 3);
  const activity = activityFor(role).slice(0, 5);
  const notif = notificationCount(role);
  const compact = width < 360;
  const firstName = user.name.split(" ")[0];

  return (
    <View style={styles.root} testID="home-screen">
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PVLogo size={34} />
        <View style={{ flex: 1 }}>
          <Text style={styles.wsName} numberOfLines={1} testID="workspace-name">
            {WORKSPACE.name}
          </Text>
          <Text style={styles.wsProject} numberOfLines={1}>
            {WORKSPACE.project} · {WORKSPACE.projectCode}
          </Text>
        </View>
        <PressableScale testID="header-notifications-button" accessibilityLabel={`Notifications, ${notif} new`} onPress={() => router.push(destinationHref("notifications"))} style={styles.iconBtn}>
          <Icon name="notifications-outline" size={19} color={colors.onSurface} />
          {notif > 0 ? (
            <View style={styles.badge} testID="notifications-badge">
              <Text style={styles.badgeText}>{notif}</Text>
            </View>
          ) : null}
        </PressableScale>
        <PressableScale testID="header-avatar-button" accessibilityLabel="Profile and demo menu" onPress={() => router.navigate("/(tabs)/more")} hitSlop={6}>
          <Avatar initials={user.initials} size={34} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomChrome + spacing.xl }]} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <PressableScale testID="active-role-chip" onPress={() => router.push("/role-switcher")} style={styles.roleChip} scaleTo={0.96}>
            <View style={styles.demoDot} />
            <Text style={styles.roleChipText}>Demo · {config.label}</Text>
            <Icon name="swap-horizontal" size={12} color={colors.brand} />
          </PressableScale>
          <Text style={styles.welcome} testID="welcome-message">
            Welcome back, {firstName}
          </Text>
          <Text style={styles.welcomeSub}>
            {config.welcome} · {formatDate(DEMO_TODAY)} 2026
          </Text>
        </Animated.View>

        {/* Summary cards */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.grid}>
          {cards.map((c, i) => {
            const hero = i === 0;
            return (
              <PressableScale key={c.key} testID={`summary-card-${c.key}`} accessibilityLabel={`${c.count} ${c.label}`} onPress={() => router.push(TARGET[c.target])} style={[styles.stat, hero && styles.statHero]}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, hero && { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                    <Icon name={c.icon} size={15} color={hero ? colors.onSurfaceInverse : colors.brand} />
                  </View>
                  <Icon name="arrow-forward" size={14} color={hero ? colors.onSurfaceInverseMuted : colors.muted} />
                </View>
                <Text style={[styles.statCount, hero && { color: colors.onSurfaceInverse }, compact && { fontSize: 22 }]} testID={`summary-count-${c.key}`}>
                  {c.count}
                </Text>
                <Text style={[styles.statLabel, hero && { color: colors.onSurfaceInverse }]} numberOfLines={2}>
                  {c.label}
                </Text>
                <Text style={[styles.statHint, hero && { color: colors.onSurfaceInverseMuted }]} numberOfLines={1}>
                  {c.hint}
                </Text>
              </PressableScale>
            );
          })}
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <SectionHeader title="Quick actions" />
          <View style={styles.grid}>
            {actions.map((a, i) => (
              <PressableScale key={a.key} testID={`quick-action-${a.key}`} onPress={() => router.push(a.href)} style={styles.action}>
                <View style={[styles.actionIcon, i === 0 && { backgroundColor: colors.brandPrimary }]}>
                  <Icon name={a.icon} size={17} color={i === 0 ? colors.onBrandPrimary : colors.brand} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {a.label}
                </Text>
                <Text style={styles.actionDesc} numberOfLines={2}>
                  {a.desc}
                </Text>
              </PressableScale>
            ))}
          </View>
        </Animated.View>

        {/* Attention */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)}>
          <SectionHeader title="Needs your attention" actionLabel="All tasks" onAction={() => router.navigate("/(tabs)/tasks")} testID="attention-see-all" />
          <Card testID="attention-card">
            {attention.length ? (
              attention.map((t, i) => <TaskRow key={t.id} task={t} showAssignee={config.permissions.approveWork} last={i === attention.length - 1} />)
            ) : (
              <EmptyState testID="attention-empty" icon="checkmark-circle-outline" title="You're all caught up" message="Nothing is due in the next two days." />
            )}
          </Card>
        </Animated.View>

        {/* Campaigns */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <SectionHeader title="Recent campaigns" actionLabel="See all" onAction={() => router.navigate("/(tabs)/campaigns")} testID="campaigns-see-all" />
          <Card testID="recent-campaigns-card">
            {campaigns.length ? (
              campaigns.map((c, i) => <CampaignRow key={c.id} campaign={c} last={i === campaigns.length - 1} />)
            ) : (
              <EmptyState testID="campaigns-empty" icon="megaphone-outline" title="No campaigns yet" message="Campaigns you're part of will show up here." />
            )}
          </Card>
        </Animated.View>

        {/* Activity */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <SectionHeader title="Recent activity" />
          <Card testID="recent-activity-card">
            {activity.length ? (
              activity.map((a, i) => <ActivityRow key={a.id} item={a} last={i === activity.length - 1} />)
            ) : (
              <EmptyState testID="activity-empty" icon="pulse-outline" title="No activity yet" message="Updates from your team will appear here." />
            )}
          </Card>
          <Text style={styles.footnote} testID="mock-data-note">
            Sample data for the {config.label} demo role · stored locally
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  wsName: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface, letterSpacing: -0.3 },
  wsProject: { fontSize: fontSize.sm, color: c.muted, marginTop: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  badge: { position: "absolute", top: 4, right: 3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: c.surfaceSecondary },
  badgeText: { color: c.onBrandPrimary, fontSize: 10, fontWeight: "800" },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: c.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, minHeight: 36, marginBottom: spacing.md },
  demoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.brandPrimary },
  roleChipText: { color: c.onBrandTertiary, fontWeight: "700", fontSize: fontSize.sm + 1 },
  welcome: { fontSize: fontSize["2xl"] + 2, fontWeight: "800", color: c.onSurface, letterSpacing: -0.6 },
  welcomeSub: { fontSize: fontSize.base, color: c.muted, marginTop: 4, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stat: { flexBasis: "47%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow1(c) },
  statHero: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  statIcon: { width: 30, height: 30, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  statCount: { fontSize: fontSize["3xl"], fontWeight: "800", color: c.onSurface, letterSpacing: -1 },
  statLabel: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface, marginTop: 2 },
  statHint: { fontSize: fontSize.sm, color: c.muted, marginTop: 2 },
  action: { flexBasis: "47%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, minHeight: 100, ...shadow1(c) },
  actionIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  actionLabel: { fontSize: fontSize.base + 1, fontWeight: "700", color: c.onSurface },
  actionDesc: { fontSize: fontSize.sm, color: c.muted, marginTop: 2, lineHeight: 16 },
  footnote: { fontSize: fontSize.sm, color: c.muted, textAlign: "center", marginTop: spacing.xl },
}));
