// Schedule a new post or reschedule / edit an existing one. Publishers and managers only.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";

import { ChipGroup, DateField, Field, FormScreen, NoAccess, TextField, TimeField, toggleIn } from "@/src/components/form";
import { can } from "@/src/config/roles";
import { CHANNELS, DEMO_TODAY } from "@/src/data/mock";
import { campaignById, formatDate, libraryAssets, visibleCampaigns } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";

export default function PostEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; taskId?: string; date?: string; assetId?: string }>();
  const { db, savePost } = useDb();
  const { role, showToast } = useDemo();
  const existing = params.id ? db.scheduled.find((s) => s.id === params.id) : undefined;
  const task = db.tasks.find((t) => t.id === (existing?.taskId ?? params.taskId));
  const preCamp = campaignById(db, existing?.cid ?? task?.cid);

  const [title, setTitle] = useState(existing?.title ?? task?.title.replace(/^(Schedule|Publish) (the )?/i, "").replace(/^./, (c) => c.toUpperCase()) ?? "");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [cid, setCid] = useState<string>(preCamp?.id ?? "none");
  const [channels, setChannels] = useState<string[]>(existing?.channels ?? task?.channels ?? preCamp?.channels ?? []);
  const [date, setDate] = useState(existing?.date ?? params.date ?? (task && task.due >= DEMO_TODAY ? task.due : DEMO_TODAY));
  const [time, setTime] = useState(existing?.time ?? "09:00");
  const [assetId, setAssetId] = useState<string>(existing?.assetId ?? params.assetId ?? "none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!role) return <Redirect href="/" />;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/publish" as Href));
  if (!can.publish(role)) return <NoAccess message="Only Publishers, Super Admins and Owner/Admins can schedule posts." onBack={close} />;

  const campaigns = visibleCampaigns(db, role).filter((c) => c.status !== "Completed" || c.id === cid);
  const assets = libraryAssets(db, role).filter((a) => cid === "none" || a.cid === cid || a.cid === null);

  const save = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Give the post a title.";
    if (!channels.length) e.channels = "Pick at least one channel.";
    if (!date) e.date = "Pick a date.";
    else if (date < DEMO_TODAY) e.date = "Pick today or a later date.";
    const clash = db.scheduled.find((s) => s.id !== existing?.id && s.date === date && s.time === time && s.channels.some((c) => channels.includes(c)) && s.status !== "Published");
    if (clash) e.time = `“${clash.title}” already goes out on that channel at this time. Pick another slot.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const input = { title: title.trim(), caption: caption.trim(), cid: cid === "none" ? null : cid, channels, date, time, taskId: task?.id ?? null, assetId: assetId === "none" ? null : assetId };
    const nid = savePost(input, role, existing?.id);
    showToast(existing ? (existing.date !== date || existing.time !== time ? `Rescheduled to ${formatDate(date)}` : "Post updated") : `Scheduled for ${formatDate(date)}`);
    if (existing) close();
    else router.replace(`/publish/${nid}` as Href);
  };

  return (
    <FormScreen testID="post-form-screen" title={existing ? "Edit or reschedule" : "Schedule a post"} onClose={close} onSave={save} saveLabel={existing ? "Save schedule" : "Schedule post"}>
      <Field label="Post title" required error={errors.title} testID="post-title-input">
        <TextField testID="post-title-input" value={title} onChangeText={setTitle} placeholder="e.g. Festive carousel" />
      </Field>
      <Field label="Caption" hint={task ? `For task: ${task.title}` : undefined}>
        <TextField testID="post-caption-input" value={caption} onChangeText={setCaption} placeholder="What should the post say?" multiline />
      </Field>
      <Field label="Date" required error={errors.date} testID="post-date">
        <DateField testID="post-date-input" value={date} onChange={setDate} />
      </Field>
      <Field label="Time" error={errors.time} testID="post-time">
        <TimeField testID="post-time-input" value={time} onChange={setTime} />
      </Field>
      <Field label="Channels" required error={errors.channels} testID="post-channels">
        <ChipGroup testIDPrefix="post-channel-option" options={Object.values(CHANNELS).map((c) => ({ key: c.id, label: c.label }))} selected={channels} onToggle={(k) => setChannels((l) => toggleIn(l, k))} />
      </Field>
      <Field label="Campaign">
        <ChipGroup testIDPrefix="post-campaign-option" options={[{ key: "none", label: "No campaign" }, ...campaigns.map((c) => ({ key: c.id, label: c.name }))]} selected={[cid]} onToggle={setCid} />
      </Field>
      <Field label="Asset" hint="Approved work and library files you can attach.">
        <ChipGroup testIDPrefix="post-asset-option" options={[{ key: "none", label: "No asset" }, ...assets.slice(0, 12).map((a) => ({ key: a.id, label: a.name }))]} selected={[assetId]} onToggle={setAssetId} />
      </Field>
    </FormScreen>
  );
}
