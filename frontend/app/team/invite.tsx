// Invite a team member with a demo role. Owner/Admins can't add owners/admins.
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";

import { ChipGroup, Field, FormScreen, NoAccess, TextField } from "@/src/components/form";
import { ROLES, assignableRoles, can } from "@/src/config/roles";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import type { RoleId } from "@/src/types";

export default function Invite() {
  const router = useRouter();
  const { db, inviteMember } = useDb();
  const { role, showToast } = useDemo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [memberRole, setMemberRole] = useState<RoleId>("editor");
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (!role) return <Redirect href="/" />;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/team" as Href));
  if (!can.manageTeam(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can invite people." onBack={close} />;

  const roles = assignableRoles(role);
  const save = () => {
    const e: Record<string, string> = {};
    const mail = email.trim().toLowerCase();
    if (!name.trim()) e.name = "Enter their name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.email = "Enter a valid email address.";
    else if (Object.values(db.people).some((p) => p.email?.toLowerCase() === mail)) e.email = "Someone with this email is already on the team.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = inviteMember({ name: name.trim(), email: mail, title: title.trim(), role: memberRole }, role);
    showToast(`Invite sent to ${name.trim()} (demo)`);
    router.replace(`/team/${id}` as Href);
  };

  return (
    <FormScreen testID="invite-form-screen" title="Invite to team" onClose={close} onSave={save} saveLabel="Send invite">
      <Field label="Full name" required error={errors.name} testID="invite-name-input">
        <TextField testID="invite-name-input" value={name} onChangeText={setName} placeholder="e.g. Priya Shah" autoCapitalize="words" />
      </Field>
      <Field label="Email" required error={errors.email} testID="invite-email-input">
        <TextField testID="invite-email-input" value={email} onChangeText={setEmail} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </Field>
      <Field label="Job title">
        <TextField testID="invite-title-input" value={title} onChangeText={setTitle} placeholder="e.g. Copywriter" />
      </Field>
      <Field label="Role" hint={role === "admin" ? "Only a Super Admin can add Owner/Admins." : ROLES[memberRole].note}>
        <ChipGroup testIDPrefix="invite-role" options={roles.map((r) => ({ key: r, label: ROLES[r].label }))} selected={[memberRole]} onToggle={(k) => setMemberRole(k as RoleId)} />
      </Field>
    </FormScreen>
  );
}
