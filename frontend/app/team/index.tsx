// Team: member list with search + role filter, invite button. Managers only.
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fab, NoAccess, SearchBar, StackHeader } from "@/src/components/form";
import { Avatar, Card, EmptyState, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { ROLES, ROLE_ORDER, can } from "@/src/config/roles";
import { isOpen, teamMembers } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { RoleId } from "@/src/types";

export default function Team() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db } = useDb();
  const { role, user } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleId | "all">("all");
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (!can.manageTeam(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can manage the team." onBack={back} />;

  const q = query.trim().toLowerCase();
  const all = teamMembers(db).filter((p) => !q || p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q) || (p.title ?? "").toLowerCase().includes(q));
  const list = all.filter((p) => filter === "all" || p.role === filter);
  const openCount = (id: string) => db.tasks.filter((t) => t.assignee === id && isOpen(t)).length;

  return (
    <View style={styles.root} testID="team-screen">
      <StackHeader title="Team" onBack={back} />
      <View style={styles.sticky}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SearchBar testID="team-search-input" value={query} onChangeText={setQuery} placeholder="Search name, email or title" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, height: 56 }} contentContainerStyle={styles.chips}>
          {(["all", ...ROLE_ORDER] as const).map((k) => {
            const on = k === filter;
            const n = k === "all" ? all.length : all.filter((p) => p.role === k).length;
            return (
              <PressableScale key={k} testID={`team-filter-${k}`} onPress={() => setFilter(k)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{k === "all" ? "All" : ROLES[k].label} {n}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 96 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Card testID="team-list">
          {list.length ? (
            list.map((p, i) => (
              <PressableScale key={p.id} testID={`team-member-${p.id}`} onPress={() => router.push(`/team/${p.id}` as Href)} style={[styles.row, i < list.length - 1 && styles.divider]} scaleTo={0.985}>
                <Avatar initials={p.initials} size={40} tone={p.status === "Active" ? "brand" : "soft"} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                    {p.id === user.id ? <Text style={styles.you}> (you)</Text> : null}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>{[ROLES[p.role].label, p.title].filter(Boolean).join(" · ")}</Text>
                  <View style={styles.inline}>
                    {p.status !== "Active" ? <Pill label={p.status ?? "Active"} tone={statusTone(p.status ?? "")} testID={`team-status-${p.id}`} /> : null}
                    <Text style={styles.meta}>{openCount(p.id)} open task{openCount(p.id) === 1 ? "" : "s"}</Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={14} color={colors.muted} />
              </PressableScale>
            ))
          ) : (
            <EmptyState testID="team-empty" icon="people-outline" title="No one found" message="Try another search or role." />
          )}
        </Card>
        <Text style={styles.foot}>Demo team — invites don’t send real emails.</Text>
      </ScrollView>
      <Fab testID="team-invite-button" label="Invite" icon="person-add-outline" bottom={insets.bottom + spacing.lg} onPress={() => router.push("/team/invite" as Href)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  sticky: { paddingTop: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  chip: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base - 1, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onSurfaceInverse },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  name: { fontSize: fontSize.base + 1, fontWeight: "700", color: c.onSurface },
  you: { fontWeight: "500", color: c.muted },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  foot: { fontSize: fontSize.sm, color: c.muted, textAlign: "center", marginTop: spacing.lg },
}));
