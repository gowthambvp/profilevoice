import { useState } from "react";

import { ListScreen } from "@/src/components/ListScreen";
import { CampaignRow } from "@/src/components/rows";
import { Card, EmptyState } from "@/src/components/ui";
import { visibleCampaigns } from "@/src/services/dashboard";
import { useActiveRole } from "@/src/state/DemoContext";

const FILTERS = ["All", "Active", "Scheduled", "Draft", "Completed"] as const;

export default function Campaigns() {
  const role = useActiveRole();
  const [active, setActive] = useState<string>("All");
  const all = visibleCampaigns(role);
  const chips = FILTERS.map((f) => ({ key: f, label: f, count: f === "All" ? all.length : all.filter((c) => c.status === f).length }));
  const list = active === "All" ? all : all.filter((c) => c.status === active);

  return (
    <ListScreen testID="campaigns-screen" title="Campaigns" subtitle={`${all.length} campaigns you can see in Herbal Care`} chips={chips} active={active} onChip={setActive}>
      <Card testID="campaigns-list">
        {list.length ? (
          list.map((c, i) => <CampaignRow key={c.id} campaign={c} last={i === list.length - 1} />)
        ) : (
          <EmptyState testID="campaigns-list-empty" icon="megaphone-outline" title={`No ${active.toLowerCase()} campaigns`} message="Campaigns appear here once they reach this stage." />
        )}
      </Card>
    </ListScreen>
  );
}
