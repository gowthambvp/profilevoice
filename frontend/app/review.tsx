// Review a task or studio draft: preview, history, approve (optional note) or reject (feedback required).
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Field, NoAccess, StackHeader, TextField } from "@/src/components/form";
import { DraftPreview } from "@/src/components/previews";
import { Button, Card, Icon, Pill, PressableScale, SectionHeader, statusTone } from "@/src/components/ui";
import { ROLES, can, isManager } from "@/src/config/roles";
import { campaignById, person, reviewsFor } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const MIN_FEEDBACK = 10;

export default function Review() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { kind, id } = useLocalSearchParams<{ kind: "task" | "draft"; id: string }>();
  const { db, setTaskStatus, setDraftStatus } = useDb();
  const { role, showToast } = useDemo();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  const task = kind === "task" ? db.tasks.find((t) => t.id === id) : undefined;
  const draft = kind === "draft" ? db.drafts.find((d) => d.id === id) : task ? db.drafts.find((d) => d.taskId === task.id) : undefined;
  const item = task ?? (kind === "draft" ? draft : undefined);
  if (!item) return <NoAccess message="This item no longer exists in this demo session." onBack={back} />;

  const owner = task ? task.assignee : draft!.owner;
  const status = task ? task.status : draft!.status;
  const title = task ? task.title : draft!.title || "Untitled draft";
  const cid = task ? task.cid : draft!.cid;
  const mine = owner === ROLES[role].personId;
  if (role === "editor" && !mine) return <NoAccess message="Creators can only see reviews of their own work." onBack={back} />;
  const canDecide = status === "In review" && (task ? can.review(role) && (isManager(role) || !mine) : isManager(role));
  const history = reviewsFor(db, kind, id);

  const decide = (approve: boolean) => {
    const text = note.trim();
    if (!approve && text.length < MIN_FEEDBACK) {
      setError(`Tell ${person(owner).name.split(" ")[0]} what to change (at least ${MIN_FEEDBACK} characters).`);
      return;
    }
    const next = approve ? "Approved" : "Changes requested";
    if (task) setTaskStatus(task.id, next, role, text);
    else setDraftStatus(draft!.id, next, role, text);
    showToast(approve ? "Approved" : "Sent back with feedback");
    back();
  };

  const ICON = { submitted: "paper-plane-outline", approved: "checkmark-circle", rejected: "close-circle" } as const;
  const LABEL = { submitted: "Sent for approval", approved: "Approved", rejected: "Rejected — changes requested" } as const;

  return (
    <View style={styles.root} testID="review-screen">
      <StackHeader title="Review" onBack={back} />
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
        <Card style={styles.pad}>
          <Text style={styles.title} testID="review-title">
            {title}
          </Text>
          <Text style={styles.meta}>
            {[task ? task.module : draft!.kind === "ad" ? "Ad Studio draft" : "Content Studio draft", `by ${person(owner).name}`, campaignById(db, cid)?.name].filter(Boolean).join(" · ")}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <Pill label={status} tone={statusTone(status)} testID="review-status" />
            <PressableScale testID="review-open-item" onPress={() => router.push((task ? `/task/${task.id}` : `/studio/editor?id=${draft!.id}`) as Href)} style={styles.link} scaleTo={0.96}>
              <Text style={styles.linkText}>Open {task ? "task" : "draft"}</Text>
              <Icon name="chevron-forward" size={13} color={colors.brand} />
            </PressableScale>
          </View>
        </Card>

        {draft ? <DraftPreview draft={draft} /> : <Card style={styles.pad}><Text style={styles.body}>{task?.description || "No brief or linked draft yet."}</Text></Card>}

        {canDecide ? (
          <Card style={styles.pad} testID="review-decision-card">
            <Field label="Feedback" hint="Optional when approving. Required when rejecting." error={error} testID="review-note-input">
              <TextField testID="review-note-input" value={note} onChangeText={(v) => { setNote(v); setError(""); }} placeholder="What works, what to change…" multiline />
            </Field>
            <Button testID="review-approve-button" label="Approve" icon="checkmark-done-outline" onPress={() => decide(true)} />
            <Button testID="review-reject-button" label="Reject with feedback" icon="return-up-back-outline" variant="ghost" onPress={() => decide(false)} />
          </Card>
        ) : (
          <View style={styles.info} testID="review-readonly-note">
            <Icon name="information-circle-outline" size={15} color={colors.muted} />
            <Text style={styles.infoText}>{status === "In review" ? (mine ? "Waiting for a reviewer." : "You can’t review this item with the current role.") : "This item isn’t waiting for review right now."}</Text>
          </View>
        )}

        <View>
          <SectionHeader title={`Review history (${history.length})`} />
          <Card testID="review-history">
            {history.length ? (
              history.map((r, i) => (
                <View key={r.id} style={[styles.hRow, i < history.length - 1 && styles.divider]} testID={`review-history-${r.action}`}>
                  <Icon name={ICON[r.action]} size={18} color={r.action === "rejected" ? colors.error : r.action === "approved" ? colors.success : colors.brand} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.hTitle}>{LABEL[r.action]}</Text>
                    <Text style={styles.meta}>
                      {person(r.by).name} · {r.at}
                    </Text>
                    {r.note ? <Text style={styles.body}>“{r.note}”</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.meta, { padding: spacing.lg }]}>No reviews yet.</Text>
            )}
          </Card>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  pad: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  body: { fontSize: fontSize.base, color: c.onSurface, lineHeight: 20 },
  link: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  linkText: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.brand },
  info: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  infoText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted },
  hRow: { flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  hTitle: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
}));
