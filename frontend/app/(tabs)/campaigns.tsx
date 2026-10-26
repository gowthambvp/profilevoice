import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fab, SearchBar } from "@/src/components/form";
import { ListScreen } from "@/src/components/ListScreen";
import { CampaignRow } from "@/src/components/rows";
import { Card, EmptyState } from "@/src/components/ui";
import { can } from "@/src/config/roles";
import { WORKSPACE } from "@/src/data/mock";
import { usesNativeTabs } from "@/src/navigation";
import { visibleCampaigns } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useActiveRole } from "@/src/state/DemoContext";
import { spacing } from "@/src/theme";

const FILTERS = ["All", "Active", "Scheduled", "Draft", "Completed"] as const;

export default function Campaigns() {
  const role = useActiveRole();
  const { db } = useDb();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const all = visibleCampaigns(db, role).filter((c) => !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  const chips = FILTERS.map((f) => ({ key: f, label: f, count: f === "All" ? all.length : all.filter((c) => c.status === f).length }));
  const list = active === "All" ? all : all.filter((c) => c.status === active);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <ListScreen
      testID="campaigns-screen"
      title="Campaigns"
      subtitle={`${visibleCampaigns(db, role).length} campaigns you can see in ${WORKSPACE.project}`}
      chips={chips}
      active={active}
      onChip={setActive}
      headerExtra={
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <SearchBar testID="campaigns-search-input" value={query} onChangeText={setQuery} placeholder="Search campaigns" />
        </View>
      }
      fab={can.manageCampaigns(role) ? <Fab testID="new-campaign-fab" label="New campaign" bottom={bottomChrome + spacing.lg} onPress={() => router.push("/campaign/edit" as Href)} /> : null}
    >
      <Card testID="campaigns-list">
        {list.length ? (
          list.map((c, i) => <CampaignRow key={c.id} campaign={c} last={i === list.length - 1} />)
        ) : (
          <EmptyState testID="campaigns-list-empty" icon="megaphone-outline" title={q ? "No matching campaigns" : `No ${active.toLowerCase()} campaigns`} message={q ? "Try a different search." : "Campaigns appear here once they reach this stage."} />
        )}
      </Card>
    </ListScreen>
  );
}
