import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/ui";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, radius, spacing, useTheme } from "@/src/theme";

export function Toast() {
  const { toast } = useDemo();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.lg, right: spacing.lg, alignItems: "center" }}>
      <Animated.View
        testID="app-toast"
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(200)}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceInverse, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill }}
      >
        <Icon name="checkmark-circle" size={15} color={colors.onSurfaceInverse} />
        <Text style={{ color: colors.onSurfaceInverse, fontSize: fontSize.base, fontWeight: "600" }}>{toast}</Text>
      </Animated.View>
    </View>
  );
}
