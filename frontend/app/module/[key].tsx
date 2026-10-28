// Temporary destination for modules planned in later phases. Always offers a Back action.
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Icon, PressableScale } from "@/src/components/ui";
import { DESTINATIONS } from "@/src/config/modules";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ModulePlaceholder() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { role, config } = useDemo();
  if (!role) return <Redirect href="/" />;

  const dest = DESTINATIONS[key] ?? { key, title: "Coming soon", icon: "construct-outline", description: "This screen is planned for a later phase.", phase: "Planned for a later phase" };
  const title = dest.title;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));

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
