// Create tab. On Android / web / older iOS the tab button opens the Create sheet instead;
// on iOS 26 native tabs this page shows the same options.
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateOptions } from "@/src/components/CreateOptions";
import { usesNativeTabs } from "@/src/navigation";
import { fontSize, makeStyles, spacing } from "@/src/theme";

export default function CreateTab() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  return (
    <View style={styles.root} testID="create-screen">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: bottomChrome + spacing.xl }}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>Start something new in this workspace.</Text>
        <CreateOptions />
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  title: { fontSize: fontSize["2xl"] + 6, fontWeight: "800", color: c.onSurface, letterSpacing: -0.8 },
  subtitle: { fontSize: fontSize.base, color: c.muted, marginTop: 2, marginBottom: spacing.lg },
}));
