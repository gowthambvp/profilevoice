// Bottom sheet frame used by modal routes (Create menu, Role switcher).
// Renders a dimmed backdrop + a card that slides up. Tap backdrop to close.
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/ui";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function Sheet({ title, subtitle, children, testID }: { title: string; subtitle?: string; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable testID={`${testID}-backdrop`} accessibilityLabel="Close" style={{ flex: 1 }} onPress={close} />
      </Animated.View>
      <Animated.View testID={testID} entering={SlideInDown.springify().damping(22).stiffness(220)} style={[styles.card, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable testID={`${testID}-close`} onPress={close} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Close">
            <Icon name="close" size={17} color={colors.onSurface} />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  card: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: "90%",
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, marginBottom: spacing.md },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: c.onSurface, letterSpacing: -0.3 },
  subtitle: { fontSize: fontSize.base, color: c.muted, marginTop: 4, lineHeight: 19 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.neutralSoft, alignItems: "center", justifyContent: "center" },
}));
