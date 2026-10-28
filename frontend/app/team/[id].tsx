// Team member profile: role, status, workload, task assignment and management controls.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup, ConfirmDialog, Field, NoAccess, StackHeader, TextField } from "@/src/components/form";
import { TaskRow } from "@/src/components/rows";
import { Avatar, Button, Card, EmptyState, Icon, Pill, SectionHeader, statusTone } from "@/src/components/ui";
import { ROLES, assignableRoles, can } from "@/src/config/roles";
import { isOpen } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { RoleId } from "@/src/types";

export default function MemberProfile() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, updateMember, removeMember } = useDb();
  const { role, user, showToast } = useDemo();
  const p = db.people[id];
  const [title, setTitle] = useState(p?.title ?? "");
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/team" as Href));
  if (!can.manageTeam(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can view team profiles." onBack={back} />;
  if (!p) return <NoAccess message="This person is no longer on the team in this demo session." onBack={back} />;

  const manage = can.manageMember(role, p.role) && p.id !== user.id;
  const tasks = db.tasks.filter((t) => t.assignee === p.id);
  const open = tasks.filter(isOpen);
  const campaigns = db.campaigns.filter((c) => c.team.includes(p.id));
  const status = p.status ?? "Active";

  return (
    <View style={styles.root} testID="member-profile-screen">
      <StackHeader title="Team member" onBack={back} />
      <KeyboardAwareScrollView bottomOffset={60} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <Avatar initials={p.initials} size={60} tone={status === "Active" ? "brand" : "soft"} />
          <Text style={styles.name} testID="member-name">{p.name}{p.id === user.id ? " (you)" : ""}</Text>
          <Text style={styles.meta}>{p.email}</Text>
          <View style={styles.inline}>
            <Pill label={ROLES[p.role].label} tone="info" testID="member-role" />
            <Pill label={status} tone={status === "Active" ? "success" : statusTone(status)} testID="member-status" />
          </View>
          <View style={styles.stats}>
            {[["Open tasks", open.length], ["Done", tasks.length - open.length], ["Campaigns", campaigns.length]].map(([k, v]) => (
              <View key={k} style={styles.stat}>
                <Text style={styles.statNum}>{v}</Text>
                <Text style={styles.meta}>{k}</Text>
              </View>
            ))}
          </View>
        </Card>

        {status !== "Deactivated" ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button testID="member-assign-task" label="Assign a task" icon="add-circle-outline" onPress={() => router.push(`/task/edit?assignee=${p.id}` as Href)} />
          </View>
        ) : null}

        <SectionHeader title={`Open tasks · ${open.length}`} />
        <Card testID="member-tasks">
          {open.length ? open.map((t, i) => <TaskRow key={t.id} task={t} last={i === open.length - 1} />) : <EmptyState icon="checkbox-outline" title="No open tasks" message="Assign work to get them started." />}
        </Card>

        {manage ? (
          <>
            <SectionHeader title="Manage" />
            <Card style={styles.pad} testID="member-manage">
              <Field label="Role" hint={p.persona ? "Demo personas keep their role so the role switcher still matches." : role === "admin" ? "Only a Super Admin can make someone an Owner/Admin." : undefined}>
                {p.persona ? (
                  <Text style={styles.value} testID="member-role-locked">{ROLES[p.role].label} · locked</Text>
                ) : (
                  <ChipGroup
                    testIDPrefix="member-role-option"
                    options={assignableRoles(role).map((r) => ({ key: r, label: ROLES[r].label }))}
                    selected={[p.role]}
                    onToggle={(k) => {
                      if (k === p.role) return;
                      updateMember(p.id, { role: k as RoleId }, role, `Changed role to ${ROLES[k as RoleId].label}`);
                      showToast(`${p.name} is now ${ROLES[k as RoleId].label}`);
                    }}
                  />
                )}
              </Field>
              <Field label="Job title">
                <TextField testID="member-title-input" value={title} onChangeText={setTitle} placeholder="e.g. Copywriter" />
                {title.trim() !== (p.title ?? "") ? (
                  <Button testID="member-title-save" label="Save title" variant="secondary" onPress={() => { updateMember(p.id, { title: title.trim() }, role); showToast("Title saved"); }} />
                ) : null}
              </Field>
              {status === "Invited" ? (
                <>
                  <Button testID="member-resend-invite" label="Resend invite (demo)" icon="mail-outline" variant="secondary" onPress={() => showToast(`Invite resent to ${p.email} (demo)`)} />
                  <Button testID="member-accept-invite" label="Mark invite accepted (demo)" icon="checkmark-circle-outline" variant="secondary" onPress={() => { updateMember(p.id, { status: "Active" }, role, "Joined the team"); showToast(`${p.name} joined the team`); }} />
                </>
              ) : null}
              {!p.persona && status === "Active" ? (
                <Button testID="member-deactivate" label="Deactivate" icon="pause-circle-outline" variant="ghost" onPress={() => { updateMember(p.id, { status: "Deactivated" }, role, "Deactivated a team member"); showToast(`${p.name} deactivated`); }} />
              ) : null}
              {status === "Deactivated" ? (
                <Button testID="member-reactivate" label="Reactivate" icon="play-circle-outline" variant="secondary" onPress={() => { updateMember(p.id, { status: "Active" }, role, "Reactivated a team member"); showToast(`${p.name} reactivated`); }} />
              ) : null}
              {!p.persona ? <Button testID="member-remove" label="Remove from team" icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} /> : null}
            </Card>
          </>
        ) : (
          <View style={styles.note} testID="member-readonly-note">
            <Icon name="lock-closed-outline" size={14} color={colors.muted} />
            <Text style={styles.noteText}>{p.id === user.id ? "This is you. Another manager can change your role." : "Only a Super Admin can change an Owner/Admin."}</Text>
          </View>
        )}
      </KeyboardAwareScrollView>
      <ConfirmDialog
        visible={confirm}
        testID="remove-member-dialog"
        title={`Remove ${p.name}?`}
        message={open.length ? `Their ${open.length} open task${open.length === 1 ? "" : "s"} will be reassigned to you.` : "They’ll lose access to this workspace."}
        confirmLabel="Remove"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          back();
          removeMember(p.id, role);
          showToast(`${p.name} removed`);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  name: { fontSize: fontSize.xl + 1, fontWeight: "800", color: c.onSurface, marginTop: spacing.xs },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  inline: { flexDirection: "row", gap: spacing.sm },
  stats: { flexDirection: "row", alignSelf: "stretch", marginTop: spacing.md, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: spacing.md },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
  pad: { padding: spacing.lg, gap: spacing.lg },
  value: { fontSize: fontSize.base, color: c.onSurface, fontWeight: "600" },
  note: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  noteText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
}));
