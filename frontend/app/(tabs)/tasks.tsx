import { useState } from "react";

import { ListScreen } from "@/src/components/ListScreen";
import { TaskRow } from "@/src/components/rows";
import { Card, EmptyState } from "@/src/components/ui";
import { isManager } from "@/src/config/roles";
import { roleTasks } from "@/src/services/dashboard";
import { useActiveRole } from "@/src/state/DemoContext";
import type { Task } from "@/src/types";

const FILTERS: { key: string; label: string; match: (t: Task) => boolean }[] = [
  { key: "open", label: "Open", match: (t) => t.status !== "Completed" && t.status !== "Approved" },
  { key: "todo", label: "To do", match: (t) => t.status === "To do" },
  { key: "progress", label: "In progress", match: (t) => t.status === "In progress" },
  { key: "review", label: "In review", match: (t) => t.status === "In review" },
  { key: "changes", label: "Changes requested", match: (t) => t.status === "Changes requested" },
  { key: "ready", label: "Ready to publish", match: (t) => t.status === "Ready to publish" },
  { key: "done", label: "Done", match: (t) => t.status === "Completed" || t.status === "Approved" },
];

export default function Tasks() {
  const role = useActiveRole();
  const [active, setActive] = useState("open");
  const all = roleTasks(role).slice().sort((a, b) => a.due.localeCompare(b.due));
  const chips = FILTERS.map((f) => ({ key: f.key, label: f.label, count: all.filter(f.match).length }));
  const filter = FILTERS.find((f) => f.key === active) ?? FILTERS[0];
  const list = all.filter(filter.match);
  const manager = isManager(role);

  return (
    <ListScreen
      testID="tasks-screen"
      title={role === "publisher" ? "Publishing tasks" : manager ? "Team tasks" : "My tasks"}
      subtitle={manager ? "Every task across the workspace" : "Tasks assigned to you"}
      chips={chips}
      active={active}
      onChip={setActive}
    >
      <Card testID="tasks-list">
        {list.length ? (
          list.map((t, i) => <TaskRow key={t.id} task={t} showAssignee={manager} last={i === list.length - 1} />)
        ) : (
          <EmptyState testID="tasks-empty" icon="file-tray-outline" title={`No ${filter.label.toLowerCase()} tasks`} message="Try another filter, or check back when new work is assigned." />
        )}
      </Card>
    </ListScreen>
  );
}
