// Role-aware list of "Create" actions. Used by the Create sheet and the iOS 26 Create tab.
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Icon, PressableScale } from "@/src/components/ui";
import { actionsFor } from "@/src/services/dashboard";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function CreateOptions({ replace = false }: { replace?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { config } = useDemo();
  const items = actionsFor(config.createActions);
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((a, i) => (
        <PressableScale
          key={a.key}
          testID={`create-option-${a.key}`}
          onPress={() => (replace ? router.replace(a.href) : router.push(a.href))}
          style={styles.option}
        >
          <View style={[styles.iconBox, i === 0 && { backgroundColor: colors.brandPrimary }]}>
            <Icon name={a.icon} size={19} color={i === 0 ? colors.onBrandPrimary : colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{a.label}</Text>
            <Text style={styles.desc}>{a.desc}</Text>
          </View>
          <Icon name="chevron-forward" size={15} color={colors.muted} />
        </PressableScale>
      ))}
      <Text style={styles.footnote}>Showing options for the {config.label} demo role.</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, minHeight: 62 },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  label: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface },
  desc: { fontSize: fontSize.base - 1, color: c.muted, marginTop: 2 },
  footnote: { fontSize: fontSize.sm, color: c.muted, textAlign: "center", marginTop: spacing.sm },
}));
