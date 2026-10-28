// Task detail: status workflow actions, due date, assignee, campaign link, edit/delete for managers.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog, DateField, HeaderIconButton, StackHeader } from "@/src/components/form";
import { MODULE_ICON, priorityTone } from "@/src/components/rows";
import { Avatar, Button, Card, ChannelDots, EmptyState, Icon, Pill, PressableScale, SectionHeader, statusTone } from "@/src/components/ui";
import { ROLES, can, taskActions, waitingNote } from "@/src/config/roles";
import { campaignById, dueLabel, formatDate, isOpen, latestDecision, person, reviewsFor } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function TaskDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, setTaskStatus, updateTask, deleteTask } = useDb();
  const { role, showToast } = useDemo();
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  const t = db.tasks.find((x) => x.id === id);
  if (!t) {
    return (
      <View style={styles.root} testID="task-not-found">
        <StackHeader title="Task" onBack={back} />
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          <EmptyState icon="file-tray-outline" title="Task not found" message="It may have been deleted in this demo session." />
          <Button testID="task-not-found-back" label="Back" icon="arrow-back" onPress={back} />
        </View>
      </View>
    );
  }

  const manage = can.manageTasks(role);
  const camp = campaignById(db, t.cid);
  const assignee = person(t.assignee);
  const actions = taskActions(t, role);
  const note = waitingNote(t, role);
  const due = isOpen(t) ? dueLabel(t.due) : { text: "Done", tone: "success" as const };

  const studioKind = t.module === "Content" ? "content" : t.module === "Ad Studio" ? "ads" : null;
  const linkedDraft = db.drafts.find((d) => d.taskId === t.id);
  const post = db.scheduled.find((s) => s.taskId === t.id);
  const decision = latestDecision(db, "task", t.id);
  const feedback = t.status === "Changes requested" && decision?.action === "rejected" && decision.note ? decision : undefined;
  const hasHistory = reviewsFor(db, "task", t.id).length > 0;

  const remove = () => {
    setConfirm(false);
    back();
    deleteTask(t.id, role);
    showToast("Task deleted");
  };

  return (
    <View style={styles.root} testID="task-detail-screen">
      <StackHeader
        title="Task"
        onBack={back}
        right={manage ? <HeaderIconButton testID="task-edit-button" icon="create-outline" label="Edit task" onPress={() => router.push(`/task/edit?id=${t.id}` as Href)} /> : null}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)}>
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.moduleIcon}>
                <Icon name={MODULE_ICON[t.module]} size={17} color={colors.onSurfaceInverse} />
              </View>
              <Text style={styles.module}>{t.module}</Text>
            </View>
            <Text style={styles.title} testID="task-title">
              {t.title}
            </Text>
            <View style={styles.pills}>
              <Pill label={t.status} tone={statusTone(t.status)} testID="task-status" />
              <Pill label={`${t.priority} priority`} tone={priorityTone(t.priority)} testID="task-priority" />
              <Pill label={due.text} tone={due.tone} testID="task-due-pill" />
            </View>
            {camp ? (
              <PressableScale testID="task-campaign-link" onPress={() => router.push(`/campaign/${camp.id}` as Href)} style={styles.campLink} scaleTo={0.98}>
                <Icon name="megaphone-outline" size={14} color={colors.brand} />
                <Text style={styles.campText} numberOfLines={1}>
                  {camp.name}
                </Text>
                <Icon name="chevron-forward" size={13} color={colors.brand} />
              </PressableScale>
            ) : null}
          </Card>
        </Animated.View>

        <SectionHeader title="Next step" />
        <Card style={{ padding: spacing.lg, gap: spacing.md }} testID="task-actions-card">
          {actions.map((a) => (
            <Button
              key={a.key}
              testID={`task-action-${a.key}`}
              label={a.label}
              icon={a.icon}
              variant={a.variant}
              onPress={() => {
                if (a.key === "changes") {
                  router.push(`/review?kind=task&id=${t.id}` as Href);
                  return;
                }
                setTaskStatus(t.id, a.status, role);
                showToast(`Status: ${a.status}`);
              }}
            />
          ))}
          {feedback ? (
            <View style={styles.feedback} testID="task-feedback">
              <Text style={styles.feedbackTitle}>Feedback from {person(feedback.by).name}</Text>
              <Text style={styles.desc}>“{feedback.note}”</Text>
            </View>
          ) : null}
          {note ? (
            <View style={styles.note} testID="task-waiting-note">
              <Icon name="information-circle-outline" size={15} color={colors.muted} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ) : null}
          {studioKind && can.useStudio(role) && (manage || t.assignee === ROLES[role].personId) ? (
            <Button
              testID="task-open-studio-button"
              label={linkedDraft ? `Open draft in ${t.module === "Content" ? "Content Studio" : "Ad Studio"}` : `Start in ${t.module === "Content" ? "Content Studio" : "Ad Studio"}`}
              icon={t.module === "Content" ? "document-text-outline" : "sparkles-outline"}
              variant="secondary"
              onPress={() => router.push((linkedDraft ? `/studio/editor?id=${linkedDraft.id}` : `/studio/editor?kind=${studioKind}&taskId=${t.id}&cid=${t.cid}`) as Href)}
            />
          ) : null}
          {t.module === "Library" && isOpen(t) && can.publish(role) && (manage || t.assignee === ROLES[role].personId) ? (
            <Button
              testID="task-schedule-post-button"
              label={post ? `View scheduled post · ${post.status}` : "Schedule the post"}
              icon="calendar-outline"
              variant="secondary"
              onPress={() => router.push((post ? `/publish/${post.id}` : `/publish/edit?taskId=${t.id}`) as Href)}
            />
          ) : null}
          {hasHistory ? <Button testID="task-review-history-button" label="Review history" icon="time-outline" variant="ghost" onPress={() => router.push(`/review?kind=task&id=${t.id}` as Href)} /> : null}
        </Card>

        <SectionHeader title="Details" />
        <Card>
          <View style={[styles.row, styles.divider]}>
            <Text style={styles.label}>Assignee</Text>
            <View style={styles.value}>
              <Avatar initials={assignee.initials} size={26} tone="soft" />
              <Text style={styles.valueText} testID="task-assignee">
                {assignee.name} · {ROLES[assignee.role].label}
              </Text>
            </View>
          </View>
          <View style={[styles.rowCol, styles.divider]}>
            <View style={styles.rowInline}>
              <Text style={styles.label}>Due date</Text>
              {!can.changeDue(role, t) ? (
                <Text style={styles.valueText} testID="task-due-date">
                  {formatDate(t.due)}
                </Text>
              ) : null}
            </View>
            {can.changeDue(role, t) ? (
              <DateField
                testID="task-due-date-field"
                value={t.due}
                onChange={(v) => {
                  updateTask(t.id, { due: v }, role, "Changed a due date");
                  showToast(`Due date set to ${formatDate(v)}`);
                }}
              />
            ) : null}
          </View>
          <View style={[styles.row, styles.divider]}>
            <Text style={styles.label}>Channels</Text>
            <View style={styles.value}>{t.channels.length ? <ChannelDots ids={t.channels} /> : <Text style={styles.valueText}>None</Text>}</View>
          </View>
          <View style={styles.rowCol}>
            <Text style={styles.label}>Brief</Text>
            <Text style={styles.desc} testID="task-description">
              {t.description || "No brief added."}
            </Text>
          </View>
        </Card>

        {manage ? (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button testID="task-edit-primary" label="Edit or reassign" icon="create-outline" variant="secondary" onPress={() => router.push(`/task/edit?id=${t.id}` as Href)} />
            <Button testID="task-delete-button" label="Delete task" icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog visible={confirm} testID="delete-task-dialog" title="Delete this task?" message={`“${t.title}” will be removed from this demo session.`} onCancel={() => setConfirm(false)} onConfirm={remove} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { padding: spacing.lg, gap: spacing.sm },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  moduleIcon: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center" },
  module: { fontSize: fontSize.sm + 1, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: fontSize.xl + 1, fontWeight: "800", color: c.onSurface, letterSpacing: -0.3, lineHeight: 25 },
  pills: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  campLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", maxWidth: "100%", marginTop: spacing.xs, paddingHorizontal: spacing.md, minHeight: 36, borderRadius: radius.pill, backgroundColor: c.brandTertiary },
  campText: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.onBrandTertiary, flexShrink: 1 },
  note: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  feedback: { padding: spacing.md, borderRadius: radius.md, backgroundColor: c.errorSoft, gap: 4 },
  feedbackTitle: { fontSize: fontSize.sm + 1, fontWeight: "700", color: c.error },
  noteText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, padding: spacing.lg, minHeight: 56 },
  rowCol: { padding: spacing.lg, gap: spacing.sm },
  rowInline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  label: { fontSize: fontSize.base, color: c.muted, fontWeight: "600" },
  value: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  valueText: { fontSize: fontSize.base, color: c.onSurface, fontWeight: "600", flexShrink: 1 },
  desc: { fontSize: fontSize.base, color: c.onSurface, lineHeight: 20 },
}));
