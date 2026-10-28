// Create / edit / assign a demo task. Managers only (Super Admin, Owner/Admin).
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";

import { addDays, ChipGroup, DateField, Field, FormScreen, NoAccess, TextField, toggleIn } from "@/src/components/form";
import { ROLES, can } from "@/src/config/roles";
import { CHANNELS, DEMO_TODAY, PEOPLE } from "@/src/data/mock";
import { assignablePeople, campaignById, visibleCampaigns } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import type { Priority, Task, TaskStatus } from "@/src/types";

const MODULES: Task["module"][] = ["Content", "Ad Studio", "Library", "Branding"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STATUSES: TaskStatus[] = ["To do", "In progress", "In review", "Changes requested", "Approved", "Ready to publish", "Completed"];

export default function TaskEdit() {
  const router = useRouter();
  const { id, cid, assignee: preAssignee } = useLocalSearchParams<{ id?: string; cid?: string; assignee?: string }>();
  const { db, createTask, updateTask, setTaskStatus } = useDb();
  const { role, showToast } = useDemo();
  const existing = id ? db.tasks.find((t) => t.id === id) : undefined;
  const preCampaign = campaignById(db, existing?.cid ?? cid);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [campaignId, setCampaignId] = useState(preCampaign?.id ?? "");
  const [module, setModule] = useState<Task["module"]>(existing?.module ?? "Content");
  const [assignee, setAssignee] = useState(existing?.assignee ?? preAssignee ?? (preCampaign?.team.find((p) => PEOPLE[p]?.role === "editor") ?? "dev"));
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "Medium");
  const [due, setDue] = useState(existing?.due ?? addDays(DEMO_TODAY, 3));
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? "To do");
  const [channels, setChannels] = useState<string[]>(existing?.channels ?? preCampaign?.channels ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!role) return <Redirect href="/" />;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (!can.manageTasks(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can create, edit or assign tasks." onBack={close} />;

  const campaigns = visibleCampaigns(db, role).filter((c) => c.status !== "Completed" || c.id === campaignId);
  const team = campaignById(db, campaignId)?.team ?? [];

  const save = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Give the task a title.";
    if (!campaignId) e.campaign = "Pick the campaign this task belongs to.";
    if (!due) e.due = "Pick a due date.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const input = { title: title.trim(), description: description.trim(), cid: campaignId, module, assignee, due, priority, status, channels };
    if (existing) {
      // Status changes go through the workflow so assets, approvals and activity stay correct.
      const keys = Object.keys(input) as (keyof typeof input)[];
      const changed = keys.some((k) => k !== "status" && JSON.stringify(input[k]) !== JSON.stringify(existing[k]));
      if (changed) updateTask(existing.id, { ...input, status: existing.status }, role);
      if (status !== existing.status) setTaskStatus(existing.id, status, role);
      showToast("Task updated");
      close();
    } else {
      const nid = createTask(input, role);
      showToast(`Task assigned to ${PEOPLE[assignee].name}`);
      router.replace(`/task/${nid}` as Href);
    }
  };

  return (
    <FormScreen testID="task-form-screen" title={existing ? "Edit task" : "New task"} onClose={close} onSave={save} saveLabel={existing ? "Save changes" : "Create & assign"}>
      <Field label="Task title" required error={errors.title} testID="task-title-input">
        <TextField testID="task-title-input" value={title} onChangeText={setTitle} placeholder="e.g. Write 3 hook variants for the reel" />
      </Field>
      <Field label="Brief">
        <TextField testID="task-desc-input" value={description} onChangeText={setDescription} placeholder="What should the assignee deliver?" multiline />
      </Field>
      <Field label="Campaign" required error={errors.campaign} testID="task-campaign">
        <ChipGroup testIDPrefix="task-campaign-option" options={campaigns.map((c) => ({ key: c.id, label: c.name }))} selected={[campaignId]} onToggle={setCampaignId} />
      </Field>
      <Field label="Assign to" hint={team.length ? "On this campaign’s team: " + team.map((p) => PEOPLE[p]?.name).join(", ") + ". Others are added to the team." : undefined}>
        <ChipGroup testIDPrefix="task-assignee-option" options={assignablePeople(db).filter((p) => p.status !== "Deactivated" || p.id === assignee).map((p) => ({ key: p.id, label: p.name, hint: ROLES[p.role].label }))} selected={[assignee]} onToggle={setAssignee} />
      </Field>
      <Field label="Module">
        <ChipGroup testIDPrefix="task-module-option" options={MODULES.map((m) => ({ key: m, label: m }))} selected={[module]} onToggle={(k) => setModule(k as Task["module"])} />
      </Field>
      <Field label="Priority">
        <ChipGroup testIDPrefix="task-priority-option" options={PRIORITIES.map((p) => ({ key: p, label: p }))} selected={[priority]} onToggle={(k) => setPriority(k as Priority)} />
      </Field>
      <Field label="Due date" required error={errors.due} testID="task-due">
        <DateField testID="task-due-input" value={due} onChange={setDue} />
      </Field>
      {existing ? (
        <Field label="Status">
          <ChipGroup testIDPrefix="task-status-option" options={STATUSES.map((s) => ({ key: s, label: s }))} selected={[status]} onToggle={(k) => setStatus(k as TaskStatus)} />
        </Field>
      ) : null}
      <Field label="Channels">
        <ChipGroup testIDPrefix="task-channel-option" options={Object.values(CHANNELS).map((c) => ({ key: c.id, label: c.label }))} selected={channels} onToggle={(k) => setChannels((l) => toggleIn(l, k))} />
      </Field>
    </FormScreen>
  );
}
