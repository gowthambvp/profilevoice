// More: profile, role-appropriate module shortcuts and the development-only demo menu.
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card, Icon, PressableScale, SectionHeader } from "@/src/components/ui";
import { destinationHref } from "@/src/config/modules";
import { MODULE_ICONS, moduleLabel } from "@/src/config/roles";
import { WORKSPACE } from "@/src/data/mock";
import { usesNativeTabs } from "@/src/navigation";
import { useDb } from "@/src/state/DataStore";
import { useActiveRole, useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { ModuleKey } from "@/src/types";

// Home, Tasks and Campaigns already live in the tab bar.
const IN_TABS: ModuleKey[] = ["home", "tasks", "campaigns"];

export default function More() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { config, user, exitDemo, showToast } = useDemo();
  const { resetData } = useDb();
  const role = useActiveRole();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const modules = config.nav.filter((k) => !IN_TABS.includes(k));

  const leave = () => {
    router.replace("/");
    exitDemo();
    resetData();
  };

  return (
    <View style={styles.root} testID="more-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>More</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: bottomChrome + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.profile} testID="profile-card">
            <Avatar initials={user.initials} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.meta}>
                {config.label} · {WORKSPACE.name}
              </Text>
              <Text style={styles.note}>{config.note}</Text>
            </View>
          </Card>
        </Animated.View>

        <SectionHeader title="Modules" />
        <View style={styles.grid} testID="more-modules-grid">
          {modules.map((k) => (
            <PressableScale key={k} testID={`more-module-${k}`} onPress={() => router.push(destinationHref(k))} style={styles.module}>
              <View style={styles.moduleIcon}>
                <Icon name={MODULE_ICONS[k]} size={19} color={colors.brand} />
              </View>
              <Text style={styles.moduleLabel} numberOfLines={2}>
                {moduleLabel(k, role)}
              </Text>
            </PressableScale>
          ))}
        </View>

        <SectionHeader title="Demo menu" />
        <Card testID="demo-menu">
          <PressableScale testID="open-role-switcher-button" onPress={() => router.push("/role-switcher")} style={[styles.row, styles.divider]} scaleTo={0.985}>
            <View style={[styles.rowIcon, { backgroundColor: colors.brandPrimary }]}>
              <Icon name="swap-horizontal" size={15} color={colors.onBrandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Switch demo role</Text>
              <Text style={styles.meta} testID="more-active-role">
                Currently {config.label}
              </Text>
            </View>
            <Icon name="chevron-forward" size={14} color={colors.muted} />
          </PressableScale>
          <PressableScale
            testID="reset-demo-data-button"
            onPress={() => {
              resetData();
              showToast("Demo data reset");
            }}
            style={[styles.row, styles.divider]}
            scaleTo={0.985}
          >
            <View style={styles.rowIcon}>
              <Icon name="refresh-outline" size={15} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Reset demo data</Text>
              <Text style={styles.meta}>Undo every campaign and task change</Text>
            </View>
          </PressableScale>
          <PressableScale testID="exit-demo-button" onPress={leave} style={styles.row} scaleTo={0.985}>
            <View style={styles.rowIcon}>
              <Icon name="log-out-outline" size={15} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Exit demo mode</Text>
              <Text style={styles.meta}>Back to the splash screen</Text>
            </View>
            <Icon name="chevron-forward" size={14} color={colors.muted} />
          </PressableScale>
        </Card>
        <View style={styles.warn}>
          <Icon name="flask-outline" size={14} color={colors.warning} />
          <Text style={styles.warnText}>Development only. Role switching changes what the prototype shows — it is not real security or sign-in.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: c.surface },
  title: { fontSize: fontSize["2xl"] + 6, fontWeight: "800", color: c.onSurface, letterSpacing: -0.8 },
  profile: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, alignItems: "flex-start" },
  name: { fontSize: fontSize.lg + 1, fontWeight: "700", color: c.onSurface },
  meta: { fontSize: fontSize.sm + 1, color: c.muted, marginTop: 2 },
  note: { fontSize: fontSize.sm + 1, color: c.onSurface, marginTop: spacing.sm, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  module: { flexBasis: "30%", flexGrow: 1, maxWidth: "32%", backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, alignItems: "center", gap: spacing.sm, minHeight: 96 },
  moduleIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  moduleLabel: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.onSurface, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, minHeight: 64 },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "700", color: c.onSurface },
  warn: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.warningSoft },
  warnText: { flex: 1, fontSize: fontSize.sm + 1, color: c.warning, lineHeight: 18 },
}));
