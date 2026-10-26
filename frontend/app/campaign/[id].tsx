// Campaign detail: overview, progress, tasks, team, assets and role-appropriate actions.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog, HeaderIconButton, ProgressBar, StackHeader } from "@/src/components/form";
import { TaskRow } from "@/src/components/rows";
import { Avatar, Button, Card, ChannelDots, EmptyState, Icon, Pill, SectionHeader, statusTone } from "@/src/components/ui";
import { ROLES, can } from "@/src/config/roles";
import { CHANNELS } from "@/src/data/mock";
import { campaignById, campaignProgress, campaignTasks, formatDate, isOpen, person, sortTasks } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { Asset } from "@/src/types";

const ASSET_ICON: Record<Asset["kind"], string> = { image: "image-outline", video: "videocam-outline", doc: "document-text-outline", post: "grid-outline" };

export default function CampaignDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, deleteCampaign } = useDb();
  const { role, showToast } = useDemo();
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  const c = campaignById(db, id);
  if (!c) {
    return (
      <View style={styles.root} testID="campaign-not-found">
        <StackHeader title="Campaign" onBack={back} />
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          <EmptyState icon="megaphone-outline" title="Campaign not found" message="It may have been deleted in this demo session." />
          <Button testID="campaign-not-found-back" label="Back" icon="arrow-back" onPress={back} />
        </View>
      </View>
    );
  }

  const manage = can.manageCampaigns(role);
  const tasks = sortTasks(campaignTasks(db, c.id), "due");
  const prog = campaignProgress(db, c.id);
  const dates = c.start ? `${formatDate(c.start)} – ${c.end ? formatDate(c.end) : "open"}` : "Dates not set";

  const remove = () => {
    setConfirm(false);
    // Tasks inside this campaign are deleted too, so never go "back" into one of them.
    router.dismissTo("/campaigns" as Href);
    deleteCampaign(c.id, role);
    showToast("Campaign deleted");
  };

  return (
    <View style={styles.root} testID="campaign-detail-screen">
      <StackHeader
        title="Campaign"
        onBack={back}
        right={manage ? <HeaderIconButton testID="campaign-edit-button" icon="create-outline" label="Edit campaign" onPress={() => router.push(`/campaign/edit?id=${c.id}` as Href)} /> : null}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
          <View style={styles.heroTop}>
            <Pill label={c.status} tone={statusTone(c.status)} testID="campaign-status" />
            {c.visibility === "private" ? (
              <View style={styles.private}>
                <Icon name="lock-closed" size={11} color={colors.onSurfaceInverseMuted} />
                <Text style={styles.heroMuted}>Private</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heroTitle} testID="campaign-name">
            {c.name}
          </Text>
          <Text style={styles.heroDesc}>{c.desc || "No description yet."}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-outline" size={13} color={colors.onSurfaceInverseMuted} />
            <Text style={styles.heroMuted} testID="campaign-dates">
              {dates}
            </Text>
            <Text style={styles.heroMuted}>·</Text>
            <Icon name="people-outline" size={13} color={colors.onSurfaceInverseMuted} />
            <Text style={styles.heroMuted}>{c.team.length} people</Text>
          </View>
          <View style={{ gap: 6, marginTop: spacing.md }}>
            <View style={styles.progHead}>
              <Text style={styles.heroLabel}>Progress</Text>
              <Text style={styles.heroLabel} testID="campaign-detail-progress">
                {prog.done} of {prog.total} tasks · {prog.pct}%
              </Text>
            </View>
            <ProgressBar pct={prog.pct} inverse />
          </View>
          <View style={styles.channels}>
            <ChannelDots ids={c.channels} />
            <Text style={styles.heroMuted} numberOfLines={1}>
              {c.channels.map((ch) => CHANNELS[ch]?.label ?? ch).join(", ") || "No channels"}
            </Text>
          </View>
        </Animated.View>

        {manage ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button testID="campaign-add-task-button" label="Add task" icon="add" onPress={() => router.push(`/task/edit?cid=${c.id}` as Href)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button testID="campaign-delete-button" label="Delete" icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} />
            </View>
          </View>
        ) : (
          <View style={styles.note} testID="campaign-readonly-note">
            <Icon name="lock-closed-outline" size={14} color={colors.muted} />
            <Text style={styles.noteText}>Only a Super Admin or Owner/Admin can edit this campaign or assign its tasks.</Text>
          </View>
        )}

        <SectionHeader title={`Tasks (${tasks.length})`} actionLabel={manage ? "Add task" : undefined} onAction={manage ? () => router.push(`/task/edit?cid=${c.id}` as Href) : undefined} testID="campaign-tasks-add" />
        <Card testID="campaign-tasks-list">
          {tasks.length ? (
            tasks.map((t, i) => <TaskRow key={t.id} task={t} showAssignee showCampaign={false} last={i === tasks.length - 1} />)
          ) : (
            <EmptyState testID="campaign-tasks-empty" icon="file-tray-outline" title="No tasks yet" message={manage ? "Add the first task and assign it to someone on the team." : "Tasks will appear once a manager assigns them."} />
          )}
        </Card>

        <SectionHeader title={`Team (${c.team.length})`} />
        <Card testID="campaign-team-list">
          {c.team.map((pid, i) => {
            const p = person(pid);
            const open = tasks.filter((t) => t.assignee === pid && isOpen(t)).length;
            return (
              <View key={pid} style={[styles.row, i < c.team.length - 1 && styles.divider]} testID={`campaign-member-${pid}`}>
                <Avatar initials={p.initials} size={34} tone={pid === c.owner ? "brand" : "soft"} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {p.name}
                    {pid === c.owner ? <Text style={styles.owner}> · Owner</Text> : null}
                  </Text>
                  <Text style={styles.rowMeta}>{ROLES[p.role].label}</Text>
                </View>
                <Pill label={`${open} open`} tone={open ? "info" : "neutral"} />
              </View>
            );
          })}
        </Card>

        <SectionHeader title={`Assets (${c.assets.length})`} />
        <Card testID="campaign-assets-list">
          {c.assets.length ? (
            c.assets.map((a, i) => (
              <View key={a.id} style={[styles.row, i < c.assets.length - 1 && styles.divider]} testID={`campaign-asset-${a.id}`}>
                <View style={styles.assetIcon}>
                  <Icon name={ASSET_ICON[a.kind]} size={15} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {a.kind[0].toUpperCase() + a.kind.slice(1)} · by {person(a.addedBy).name}
                    {a.from ? (a.from.startsWith("d") ? " · from a draft" : " · from a task") : ""}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <EmptyState testID="campaign-assets-empty" icon="albums-outline" title="No assets yet" message="Approved work from this campaign's tasks is added here automatically." />
          )}
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={confirm}
        testID="delete-campaign-dialog"
        title="Delete this campaign?"
        message={`“${c.name}” and its ${tasks.length} task${tasks.length === 1 ? "" : "s"} will be removed from this demo session.`}
        onCancel={() => setConfirm(false)}
        onConfirm={remove}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { backgroundColor: c.surfaceInverse, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  private: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroTitle: { fontSize: fontSize.xl + 2, fontWeight: "800", color: c.onSurfaceInverse, letterSpacing: -0.4 },
  heroDesc: { fontSize: fontSize.base, color: c.onSurfaceInverseMuted, lineHeight: 19 },
  heroMuted: { fontSize: fontSize.sm + 1, color: c.onSurfaceInverseMuted },
  heroLabel: { fontSize: fontSize.sm + 1, color: c.onSurfaceInverse, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  progHead: { flexDirection: "row", justifyContent: "space-between" },
  channels: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  note: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  noteText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface },
  rowMeta: { fontSize: fontSize.sm + 1, color: c.muted, marginTop: 1 },
  owner: { color: c.brandPrimary, fontWeight: "700" },
  assetIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
}));
