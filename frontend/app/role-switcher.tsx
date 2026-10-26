// Development-only role selector. Changes what the prototype shows — not security.
import { Redirect, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { RoleList } from "@/src/components/RoleList";
import { Sheet } from "@/src/components/Sheet";
import { Icon } from "@/src/components/ui";
import { ROLES } from "@/src/config/roles";
import { useActiveRole, useDemo } from "@/src/state/DemoContext";
import { fontSize, radius, spacing, useTheme } from "@/src/theme";
import type { RoleId } from "@/src/types";

export default function RoleSwitcher() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setRole, showToast, role: current } = useDemo();
  const role = useActiveRole();
  if (!current) return <Redirect href="/" />;

  const choose = (r: RoleId) => {
    if (r !== role) {
      setRole(r);
      showToast(`Now viewing as ${ROLES[r].label}`);
    }
    if (router.canGoBack()) router.back();
  };

  return (
    <Sheet testID="role-switcher-sheet" title="Switch demo role" subtitle="Preview the app as each role. Navigation, dashboard and actions update instantly.">
      <RoleList value={role} onChange={choose} />
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft }}>
        <Icon name="flask-outline" size={14} color={colors.warning} />
        <Text style={{ flex: 1, fontSize: fontSize.sm + 1, color: colors.warning, lineHeight: 18 }}>
          Prototype only — this selector is not real access control.
        </Text>
      </View>
    </Sheet>
  );
}
