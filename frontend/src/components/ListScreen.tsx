// Shared layout for tab list screens: sticky large title + horizontal filter chips + scrolling list.
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { fontSize, makeStyles, radius, spacing } from "@/src/theme";

export interface Chip {
  key: string;
  label: string;
  count: number;
}

export function ListScreen({
  title,
  subtitle,
  chips,
  active,
  onChip,
  children,
  testID,
  headerExtra,
  fab,
}: {
  title: string;
  subtitle: string;
  chips: Chip[];
  active: string;
  onChip: (k: string) => void;
  children: ReactNode;
  testID: string;
  headerExtra?: ReactNode;
  fab?: ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  return (
    <View style={styles.root} testID={testID}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {headerExtra}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {chips.map((c) => {
            const on = c.key === active;
            return (
              <PressableScale key={c.key} testID={`filter-chip-${c.key}`} onPress={() => onChip(c.key)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95} accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {c.label} {c.count}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomChrome + spacing.xl + (fab ? 72 : 0) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {children}
      </ScrollView>
      {fab}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  title: { fontSize: fontSize["2xl"] + 6, fontWeight: "800", color: c.onSurface, letterSpacing: -0.8, paddingHorizontal: spacing.lg },
  subtitle: { fontSize: fontSize.base, color: c.muted, marginTop: 2, paddingHorizontal: spacing.lg },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  chip: { height: 36, flexShrink: 0, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base - 1, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onSurfaceInverse },
  list: { padding: spacing.lg },
}));
