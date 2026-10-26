// Small reusable building blocks shared by every screen.
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Platform, Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { CHANNELS } from "@/src/data/mock";
import { fontSize, makeStyles, radius, shadow1, spacing, useTheme, type ThemeColors } from "@/src/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PSProps = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; haptic?: boolean; scaleTo?: number };

export function PressableScale({ style, onPressIn, onPressOut, onPress, haptic = true, scaleTo = 0.97, ...rest }: PSProps) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      style={[style, a]}
      onPressIn={(e) => {
        s.value = withSpring(scaleTo, { damping: 20, stiffness: 420 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 18, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
    />
  );
}

export function Icon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  return <Ionicons name={name as never} size={size} color={color} />;
}

export function Card({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const styles = useStyles();
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function Avatar({ initials, size = 36, tone = "brand", testID }: { initials: string; size?: number; tone?: "brand" | "soft"; testID?: string }) {
  const { colors } = useTheme();
  const bg = tone === "brand" ? colors.brand : colors.brandTertiary;
  const fg = tone === "brand" ? colors.onBrand : colors.onBrandTertiary;
  return (
    <View testID={testID} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function PVLogo({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: inverse ? colors.onDeepTeal : colors.deepTeal,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: inverse ? colors.deepTeal : colors.onDeepTeal, fontWeight: "800", fontSize: size * 0.38, letterSpacing: 0.5 }}>PV</Text>
      <View style={{ position: "absolute", right: size * 0.16, bottom: size * 0.16, width: size * 0.16, height: size * 0.16, borderRadius: size, backgroundColor: colors.brandPrimary }} />
    </View>
  );
}

type Tone = "success" | "warning" | "error" | "info" | "neutral";
const toneColors = (c: ThemeColors, t: Tone) =>
  ({
    success: [c.successSoft, c.success],
    warning: [c.warningSoft, c.warning],
    error: [c.errorSoft, c.error],
    info: [c.infoSoft, c.info],
    neutral: [c.neutralSoft, c.muted],
  })[t];

export const statusTone = (s: string): Tone =>
  (({
    Active: "success",
    Completed: "success",
    Published: "success",
    Draft: "neutral",
    "To do": "neutral",
    "In progress": "info",
    Scheduled: "info",
    Approved: "info",
    "Ready to publish": "info",
    "In review": "warning",
    "Changes requested": "error",
  }) as Record<string, Tone>)[s] ?? "neutral";

export function Pill({ label, tone = "neutral", testID }: { label: string; tone?: Tone; testID?: string }) {
  const { colors } = useTheme();
  const [bg, fg] = toneColors(colors, tone);
  return (
    <View testID={testID} style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: fontSize.sm, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function ChannelDots({ ids }: { ids: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {ids.slice(0, 4).map((id) => {
        const ch = CHANNELS[id];
        return (
          <View key={id} accessibilityLabel={ch?.label ?? id} style={{ minWidth: 22, height: 18, paddingHorizontal: 4, borderRadius: radius.sm, backgroundColor: ch?.color ?? colors.muted, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{ch?.abbr ?? "?"}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction, testID }: { title: string; actionLabel?: string; onAction?: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable testID={testID} onPress={onAction} hitSlop={12} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <Icon name="chevron-forward" size={12} color={colors.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, message, testID }: { icon: string; title: string; message: string; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={20} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

export function Button({ label, onPress, variant = "primary", icon, testID }: { label: string; onPress: () => void; variant?: "primary" | "secondary" | "ghost"; icon?: string; testID?: string }) {
  const { colors } = useTheme();
  const bg = variant === "primary" ? colors.brandPrimary : variant === "secondary" ? colors.brandTertiary : "transparent";
  const fg = variant === "primary" ? colors.onBrandPrimary : colors.brand;
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      style={{
        minHeight: 48,
        borderRadius: radius.md,
        backgroundColor: bg,
        borderWidth: variant === "ghost" ? 1 : 0,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
      }}
    >
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: fontSize.lg, fontWeight: "700" }}>{label}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, ...shadow1(c) },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md, marginTop: spacing.xl },
  sectionTitle: { fontSize: fontSize.lg + 1, fontWeight: "700", color: c.onSurface, letterSpacing: -0.2 },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 32 },
  sectionActionText: { color: c.brand, fontSize: fontSize.base, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  emptyMsg: { fontSize: fontSize.base, color: c.muted, textAlign: "center", lineHeight: 20 },
}));
