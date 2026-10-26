// Radio list of the four demo roles. Used on the splash screen and in the role switcher.
import { Text, View } from "react-native";

import { Icon, PressableScale } from "@/src/components/ui";
import { ROLE_ORDER, ROLES } from "@/src/config/roles";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { RoleId } from "@/src/types";

const ROLE_ICON: Record<RoleId, string> = {
  super_admin: "shield-checkmark-outline",
  admin: "briefcase-outline",
  editor: "create-outline",
  publisher: "paper-plane-outline",
};

export function RoleList({ value, onChange, dark = false }: { value: RoleId; onChange: (r: RoleId) => void; dark?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {ROLE_ORDER.map((r) => {
        const on = value === r;
        const cfg = ROLES[r];
        return (
          <PressableScale
            key={r}
            testID={`role-option-${r}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            aria-checked={on}
            accessibilityLabel={`${cfg.label}, ${cfg.badge}`}
            onPress={() => onChange(r)}
            style={[styles.item, dark && styles.itemDark, on && (dark ? styles.itemOnDark : styles.itemOn)]}
            scaleTo={0.98}
          >
            <View style={[styles.icon, dark && styles.iconDark, on && { backgroundColor: colors.brandPrimary }]}>
              <Icon name={ROLE_ICON[r]} size={15} color={on ? colors.onBrandPrimary : dark ? colors.onSurfaceInverse : colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, dark && { color: colors.onSurfaceInverse }]}>{cfg.label}</Text>
              <Text style={[styles.badge, dark && { color: colors.onSurfaceInverseMuted }]} numberOfLines={2}>
                {cfg.badge}
              </Text>
            </View>
            <View style={[styles.radio, dark && { borderColor: colors.onSurfaceInverseMuted }, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary, minHeight: 60 },
  itemDark: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" },
  itemOn: { borderColor: c.brandPrimary, backgroundColor: c.warningSoft },
  itemOnDark: { borderColor: c.brandPrimary, backgroundColor: "rgba(192,90,44,0.18)" },
  icon: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  iconDark: { backgroundColor: "rgba(255,255,255,0.1)" },
  label: { fontSize: fontSize.lg - 1, fontWeight: "700", color: c.onSurface },
  badge: { fontSize: fontSize.sm, color: c.muted, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: c.brandPrimary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.brandPrimary },
}));
