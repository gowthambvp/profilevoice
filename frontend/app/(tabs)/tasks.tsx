import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fab, SearchBar, Segmented } from "@/src/components/form";
import { ListScreen } from "@/src/components/ListScreen";
import { TaskRow } from "@/src/components/rows";
import { Card, EmptyState, Icon, PressableScale } from "@/src/components/ui";
import { can, isManager } from "@/src/config/roles";
import { usesNativeTabs } from "@/src/navigation";
import { campaignById, dueBucket, isOpen, isOverdue, isUpcoming, roleTasks, sortTasks, type Bucket, type SortKey, type TaskScope } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useActiveRole } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { Task } from "@/src/types";

const FILTERS: { key: string; label: string; match: (t: Task) => boolean }[] = [
  { key: "open", label: "Open", match: isOpen },
  { key: "overdue", label: "Overdue", match: isOverdue },
  { key: "upcoming", label: "Upcoming", match: isUpcoming },
  { key: "todo", label: "To do", match: (t) => t.status === "To do" },
  { key: "progress", label: "In progress", match: (t) => t.status === "In progress" },
  { key: "review", label: "In review", match: (t) => t.status === "In review" },
  { key: "changes", label: "Changes requested", match: (t) => t.status === "Changes requested" },
  { key: "ready", label: "Ready to publish", match: (t) => t.status === "Ready to publish" },
  { key: "done", label: "Done", match: (t) => !isOpen(t) },
];
const SORTS: { key: SortKey; label: string }[] = [
  { key: "due", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "recent", label: "Recently updated" },
];
const SCOPES: { key: TaskScope; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "My tasks" },
  { key: "team", label: "Team" },
];
const BUCKETS: Bucket[] = ["Overdue", "Due today", "This week", "Later", "Done"];

export default function Tasks() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const role = useActiveRole();
  const { db } = useDb();
  const manager = isManager(role);
  const [scope, setScope] = useState<TaskScope>("all");
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("due");

  const q = query.trim().toLowerCase();
  const base = roleTasks(db, role, scope).filter(
    (t) => !q || t.title.toLowerCase().includes(q) || (campaignById(db, t.cid)?.name.toLowerCase().includes(q) ?? false),
  );
  const chips = FILTERS.map((f) => ({ key: f.key, label: f.label, count: base.filter(f.match).length }));
  const current = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const list = sortTasks(base.filter(current.match), sort);
  const groups = sort === "due" ? BUCKETS.map((b) => ({ title: b as string, items: list.filter((t) => dueBucket(t) === b) })).filter((g) => g.items.length) : [{ title: "", items: list }];
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const sortLabel = SORTS.find((s) => s.key === sort)?.label;
  const cycleSort = () => setSort(SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length].key);
  const showAssignee = manager && scope !== "mine";

  const headerExtra = (
    <View style={styles.extra}>
      <SearchBar testID="tasks-search-input" value={query} onChangeText={setQuery} placeholder="Search tasks or campaigns" />
      <View style={styles.toolRow}>
        {manager ? <Segmented options={SCOPES} value={scope} onChange={setScope} testIDPrefix="tasks-scope" /> : <Text style={styles.scopeNote}>Assigned to you</Text>}
        <PressableScale testID="tasks-sort-button" accessibilityLabel={`Sort by ${sortLabel}. Tap to change`} onPress={cycleSort} style={styles.sort} scaleTo={0.95}>
          <Icon name="swap-vertical" size={14} color={colors.brand} />
          <Text style={styles.sortText} numberOfLines={1}>
            {sortLabel}
          </Text>
        </PressableScale>
      </View>
    </View>
  );

  return (
    <ListScreen
      testID="tasks-screen"
      title={role === "publisher" ? "Publishing tasks" : manager ? "Tasks" : "My tasks"}
      subtitle={manager ? "Assign, track and approve work" : "Tasks assigned to you"}
      chips={chips}
      active={filter}
      onChip={setFilter}
      headerExtra={headerExtra}
      fab={can.manageTasks(role) ? <Fab testID="new-task-fab" label="New task" bottom={bottomChrome + spacing.lg} onPress={() => router.push("/task/edit" as Href)} /> : null}
    >
      <View testID="tasks-list">
        {list.length ? (
          groups.map((g) => (
            <View key={g.title || "all"} style={{ marginBottom: spacing.lg }}>
              {g.title ? (
                <Text style={[styles.group, g.title === "Overdue" && { color: colors.error }]} testID={`task-group-${g.title.toLowerCase().replace(/ /g, "-")}`}>
                  {g.title} · {g.items.length}
                </Text>
              ) : null}
              <Card>
                {g.items.map((t, i) => (
                  <TaskRow key={t.id} task={t} showAssignee={showAssignee} last={i === g.items.length - 1} />
                ))}
              </Card>
            </View>
          ))
        ) : (
          <Card>
            <EmptyState testID="tasks-empty" icon="file-tray-outline" title={q ? "No matching tasks" : `No ${current.label.toLowerCase()} tasks`} message={q ? "Try a different search or filter." : "Try another filter, or check back when new work is assigned."} />
          </Card>
        )}
      </View>
    </ListScreen>
  );
}

const useStyles = makeStyles((c) => ({
  extra: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  toolRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  scopeNote: { fontSize: fontSize.sm + 1, color: c.muted, fontWeight: "600" },
  sort: { flexDirection: "row", alignItems: "center", gap: 4, height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.brandTertiary, flexShrink: 1 },
  sortText: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.onBrandTertiary },
  group: { fontSize: fontSize.sm + 1, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm, marginLeft: spacing.xs },
}));
