// Splash + Demo Mode entry. No real sign-in: demo mode runs entirely on local data.
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleList } from "@/src/components/RoleList";
import { Button, Icon, PVLogo } from "@/src/components/ui";
import { ROLES } from "@/src/config/roles";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { RoleId } from "@/src/types";

export default function Splash() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setRole, showToast } = useDemo();
  const [pick, setPick] = useState<RoleId>("super_admin");

  const start = () => {
    setRole(pick);
    showToast(`Demo started as ${ROLES[pick].label}`);
    router.replace("/home");
  };

  return (
    <View style={styles.root} testID="splash-screen">
      <StatusBar style="light" />
      <LinearGradient colors={[colors.deepTeal, colors.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheetFill} />
      <View style={styles.glow} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing["2xl"], paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.brand}>
          <PVLogo size={60} inverse />
          <Text style={styles.wordmark} testID="splash-wordmark">
            ProfileVoice
          </Text>
          <Text style={styles.tagline}>Plan campaigns, make the work, approve it and publish — one role-based workspace.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.panel}>
          <View style={styles.demoBadge}>
            <Icon name="flask-outline" size={12} color={colors.onBrandPrimary} />
            <Text style={styles.demoBadgeText}>DEMO MODE</Text>
          </View>
          <Text style={styles.panelTitle}>Choose a role to explore</Text>
          <Text style={styles.panelSub}>You can switch roles any time from the demo menu.</Text>
          <View style={{ height: spacing.lg }} />
          <RoleList value={pick} onChange={setPick} dark />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ gap: spacing.md }}>
          <Button testID="enter-demo-mode-button" label="Enter Demo Mode" icon="arrow-forward" onPress={start} />
          <View style={styles.notice} testID="demo-disclaimer">
            <Icon name="information-circle-outline" size={14} color={colors.onSurfaceInverseMuted} />
            <Text style={styles.noticeText}>
              Demo mode uses local sample data on this device. Nothing is sent to a server and no real sign-in happens.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const StyleSheetFill = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.deepTeal, overflow: "hidden" },
  glow: { position: "absolute", width: 320, height: 320, borderRadius: 160, backgroundColor: c.brandPrimary, opacity: 0.16, top: -80, right: -120 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, gap: spacing.xl, justifyContent: "space-between" },
  brand: { alignItems: "flex-start", gap: spacing.md, marginTop: spacing.lg },
  wordmark: { fontSize: 30, fontWeight: "800", color: c.onSurfaceInverse, letterSpacing: -1, marginTop: spacing.sm },
  tagline: { fontSize: fontSize.lg, color: c.onSurfaceInverseMuted, lineHeight: 23, maxWidth: 340 },
  panel: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: spacing.lg },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: c.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginBottom: spacing.md },
  demoBadgeText: { color: c.onBrandPrimary, fontSize: fontSize.sm - 1, fontWeight: "800", letterSpacing: 1 },
  panelTitle: { fontSize: fontSize.xl, fontWeight: "700", color: c.onSurfaceInverse },
  panelSub: { fontSize: fontSize.base, color: c.onSurfaceInverseMuted, marginTop: 4 },
  notice: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingHorizontal: spacing.xs },
  noticeText: { flex: 1, fontSize: fontSize.sm + 1, color: c.onSurfaceInverseMuted, lineHeight: 18 },
}));
