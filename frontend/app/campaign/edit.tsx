// Create / edit a demo campaign. Managers only (Super Admin, Owner/Admin).
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";

import { ChipGroup, DateField, Field, FormScreen, NoAccess, TextField, toggleIn } from "@/src/components/form";
import { ROLES, can } from "@/src/config/roles";
import { CHANNELS, DEMO_TODAY, PEOPLE } from "@/src/data/mock";
import { campaignById } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import type { Campaign } from "@/src/types";

const STATUSES: Campaign["status"][] = ["Draft", "Scheduled", "Active", "Completed"];

export default function CampaignEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, createCampaign, updateCampaign } = useDb();
  const { role, showToast } = useDemo();
  const existing = id ? campaignById(db, id) : undefined;
  const me = role ? ROLES[role].personId : "rohi";

  const [name, setName] = useState(existing?.name ?? "");
  const [desc, setDesc] = useState(existing?.desc ?? "");
  const [status, setStatus] = useState<Campaign["status"]>(existing?.status ?? "Draft");
  const [start, setStart] = useState(existing?.start ?? DEMO_TODAY);
  const [end, setEnd] = useState(existing?.end ?? "");
  const [visibility, setVisibility] = useState<Campaign["visibility"]>(existing?.visibility ?? "public");
  const [team, setTeam] = useState<string[]>(existing?.team ?? [me]);
  const [channels, setChannels] = useState<string[]>(existing?.channels ?? ["instagram"]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!role) return <Redirect href="/" />;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (!can.manageCampaigns(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can create or edit campaigns. Creators and Publishers can request one instead." onBack={close} />;

  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give the campaign a name.";
    if (!channels.length) e.channels = "Pick at least one channel.";
    if (!team.length) e.team = "Add at least one team member.";
    if (start && end && end < start) e.end = "End date can’t be before the start date.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const input = { name: name.trim(), desc: desc.trim(), status, start, end, visibility, team, channels };
    if (existing) {
      updateCampaign(existing.id, input, role);
      showToast("Campaign updated");
      close();
    } else {
      const nid = createCampaign(input, role);
      showToast("Campaign created");
      router.replace(`/campaign/${nid}` as Href);
    }
  };

  return (
    <FormScreen testID="campaign-form-screen" title={existing ? "Edit campaign" : "New campaign"} onClose={close} onSave={save} saveLabel={existing ? "Save changes" : "Create campaign"}>
      <Field label="Campaign name" required error={errors.name} testID="campaign-name-input">
        <TextField testID="campaign-name-input" value={name} onChangeText={setName} placeholder="e.g. Diwali Gifting Drop" returnKeyType="next" />
      </Field>
      <Field label="Brief" hint="What is this campaign for? Who should it reach?">
        <TextField testID="campaign-desc-input" value={desc} onChangeText={setDesc} placeholder="Short description for the team" multiline />
      </Field>
      <Field label="Status">
        <ChipGroup testIDPrefix="campaign-status-option" options={STATUSES.map((s) => ({ key: s, label: s }))} selected={[status]} onToggle={(k) => setStatus(k as Campaign["status"])} />
      </Field>
      <Field label="Start date">
        <DateField testID="campaign-start-date" value={start} onChange={setStart} />
      </Field>
      <Field label="End date" error={errors.end} testID="campaign-end-date">
        <DateField testID="campaign-end-date" value={end} onChange={setEnd} placeholder="No end date" />
      </Field>
      <Field label="Channels" required error={errors.channels} testID="campaign-channels">
        <ChipGroup testIDPrefix="campaign-channel-option" options={Object.values(CHANNELS).map((c) => ({ key: c.id, label: c.label }))} selected={channels} onToggle={(k) => setChannels((l) => toggleIn(l, k))} />
      </Field>
      <Field label="Team" required error={errors.team} testID="campaign-team" hint="People on the team can be assigned this campaign's tasks.">
        <ChipGroup testIDPrefix="campaign-team-option" options={Object.values(PEOPLE).map((p) => ({ key: p.id, label: p.name, hint: ROLES[p.role].label }))} selected={team} onToggle={(k) => setTeam((l) => toggleIn(l, k))} />
      </Field>
      <Field label="Visibility" hint={visibility === "private" ? "Only the team and managers can see it." : "Everyone in the project can see it."}>
        <ChipGroup testIDPrefix="campaign-visibility-option" options={[{ key: "public", label: "Everyone in project" }, { key: "private", label: "Private to team" }]} selected={[visibility]} onToggle={(k) => setVisibility(k as Campaign["visibility"])} />
      </Field>
    </FormScreen>
  );
}
