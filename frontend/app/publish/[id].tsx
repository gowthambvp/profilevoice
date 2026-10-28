// Scheduled post detail: preview, demo publish, pause/resume, retry, reschedule and delete.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog, HeaderIconButton, longDate, NoAccess, StackHeader } from "@/src/components/form";
import { Avatar, Button, Card, ChannelDots, Icon, Pill, PressableScale, SectionHeader, statusTone } from "@/src/components/ui";
import { can } from "@/src/config/roles";
import { CHANNELS } from "@/src/data/mock";
import { campaignById, findAsset, format12, person } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function PostDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, setPostStatus, deletePost } = useDb();
  const { role, showToast } = useDemo();
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/publish" as Href));
  if (!can.publish(role)) return <NoAccess message="Publishing is handled by Publishers, Super Admins and Owner/Admins." onBack={back} />;
  const s = db.scheduled.find((x) => x.id === id);
  if (!s) return <NoAccess message="This post no longer exists in this demo session." onBack={back} />;

  const camp = campaignById(db, s.cid);
  const task = s.taskId ? db.tasks.find((t) => t.id === s.taskId) : undefined;
  const asset = s.assetId ? findAsset(db, s.assetId) : undefined;
  const live = s.status === "Published";

  const publishNow = () => {
    setPostStatus(s.id, "Publishing", role);
    showToast("Publishing (demo)…");
    // Simulated hand-off — nothing is sent to a real social network. Finishes even if you leave the screen.
    setTimeout(() => {
      setPostStatus(s.id, "Published", role);
      showToast("Published (demo)");
    }, 1200);
  };

  return (
    <View style={styles.root} testID="post-detail-screen">
      <StackHeader
        title="Scheduled post"
        onBack={back}
        right={!live ? <HeaderIconButton testID="post-edit-button" icon="create-outline" label="Edit or reschedule" onPress={() => router.push(`/publish/edit?id=${s.id}` as Href)} /> : null}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Card style={styles.pad}>
          <View style={styles.inline}>
            <Pill label={s.status} tone={statusTone(s.status)} testID="post-status" />
            <ChannelDots ids={s.channels} />
          </View>
          <Text style={styles.title} testID="post-title">{s.title}</Text>
          <View style={styles.inline}>
            <Icon name="calendar-outline" size={14} color={colors.brand} />
            <Text style={styles.when} testID="post-when">{longDate(s.date)} · {format12(s.time)}</Text>
          </View>
          {s.status === "Failed" && s.note ? (
            <View style={styles.fail} testID="post-failure-note">
              <Icon name="alert-circle-outline" size={15} color={colors.error} />
              <Text style={styles.failText}>{s.note}</Text>
            </View>
          ) : null}
        </Card>

        <SectionHeader title="Preview" />
        <Card style={styles.preview} testID="post-preview">
          <View style={styles.inline}>
            <Avatar initials="HC" size={30} />
            <View>
              <Text style={styles.label}>Herbal Care</Text>
              <Text style={styles.meta}>{s.channels.map((c) => CHANNELS[c]?.label ?? c).join(" · ")}</Text>
            </View>
          </View>
          <View style={styles.media}>
            <Icon name={asset?.kind === "video" ? "play-circle" : "image-outline"} size={30} color={colors.onSurfaceInverse} />
            <Text style={styles.mediaText}>{asset ? asset.name : "No asset attached"}</Text>
          </View>
          <Text style={styles.caption} testID="post-caption">{s.caption || "No caption yet."}</Text>
        </Card>

        <SectionHeader title="Actions" />
        <Card style={styles.pad} testID="post-actions">
          {s.status === "Scheduled" ? (
            <>
              <Button testID="post-publish-now" label="Publish now (demo)" icon="rocket-outline" onPress={publishNow} />
              <Button testID="post-pause" label="Pause" icon="pause-outline" variant="secondary" onPress={() => { setPostStatus(s.id, "Paused", role); showToast("Post paused"); }} />
            </>
          ) : null}
          {s.status === "Paused" ? <Button testID="post-resume" label="Resume schedule" icon="play-outline" onPress={() => { setPostStatus(s.id, "Scheduled", role); showToast("Back on the schedule"); }} /> : null}
          {s.status === "Failed" ? <Button testID="post-retry" label="Retry now (demo)" icon="refresh-outline" onPress={publishNow} /> : null}
          {s.status === "Publishing" ? <Text style={styles.meta} testID="post-publishing-note">Sending to the demo channels…</Text> : null}
          {s.status === "Scheduled" ? <Button testID="post-simulate-fail" label="Simulate a failed publish" icon="flask-outline" variant="ghost" onPress={() => { setPostStatus(s.id, "Failed", role, "Channel rejected the post (simulated). Retry or reschedule."); showToast("Marked as failed (demo)"); }} /> : null}
          {!live && s.status !== "Publishing" ? <Button testID="post-reschedule" label="Reschedule" icon="calendar-outline" variant="secondary" onPress={() => router.push(`/publish/edit?id=${s.id}` as Href)} /> : null}
          {live ? <Text style={styles.meta} testID="post-live-note">This post went live in the demo. Nothing was sent to a real account.</Text> : null}
        </Card>

        <SectionHeader title="Details" />
        <Card>
          <View style={[styles.row, styles.divider]}>
            <Text style={styles.label}>Scheduled by</Text>
            <Text style={styles.value}>{person(s.owner).name}</Text>
          </View>
          <PressableScale testID="post-campaign-link" disabled={!camp} onPress={() => camp && router.push(`/campaign/${camp.id}` as Href)} style={[styles.row, styles.divider]} scaleTo={0.985}>
            <Text style={styles.label}>Campaign</Text>
            <Text style={[styles.value, camp && { color: colors.brand }]} numberOfLines={1}>{camp?.name ?? "None"}</Text>
          </PressableScale>
          <PressableScale testID="post-task-link" disabled={!task} onPress={() => task && router.push(`/task/${task.id}` as Href)} style={[styles.row, styles.divider]} scaleTo={0.985}>
            <Text style={styles.label}>Publishing task</Text>
            <Text style={[styles.value, task && { color: colors.brand }]} numberOfLines={1}>{task ? `${task.title} · ${task.status}` : "None"}</Text>
          </PressableScale>
          <PressableScale testID="post-asset-link" disabled={!asset} onPress={() => asset && router.push(`/asset/${asset.id}` as Href)} style={styles.row} scaleTo={0.985}>
            <Text style={styles.label}>Asset</Text>
            <Text style={[styles.value, asset && { color: colors.brand }]} numberOfLines={1}>{asset?.name ?? "None"}</Text>
          </PressableScale>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button testID="post-delete-button" label={live ? "Remove from history" : "Cancel this post"} icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} />
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirm}
        testID="delete-post-dialog"
        title={live ? "Remove this post?" : "Cancel this post?"}
        message={`“${s.title}” will be removed from the schedule.`}
        confirmLabel={live ? "Remove" : "Cancel post"}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          back();
          deletePost(s.id, role);
          showToast("Post removed");
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  pad: { padding: spacing.lg, gap: spacing.md },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  title: { fontSize: fontSize.xl + 1, fontWeight: "800", color: c.onSurface, letterSpacing: -0.3 },
  when: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurface },
  fail: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.errorSoft },
  failText: { flex: 1, fontSize: fontSize.sm + 1, color: c.error, lineHeight: 17 },
  preview: { padding: spacing.lg, gap: spacing.md },
  media: { aspectRatio: 16 / 10, borderRadius: radius.md, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  mediaText: { fontSize: fontSize.sm, color: c.onSurfaceInverseMuted, paddingHorizontal: spacing.lg, textAlign: "center" },
  caption: { fontSize: fontSize.base, color: c.onSurface, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, padding: spacing.lg, minHeight: 52 },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  label: { fontSize: fontSize.base, color: c.muted, fontWeight: "600" },
  value: { fontSize: fontSize.base, color: c.onSurface, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  meta: { fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
}));
