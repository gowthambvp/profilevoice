// List rows for tasks, campaigns and activity — shared across Home, Tasks, Campaigns and details.
import { useRouter, type Href } from "expo-router";
import { Text, View } from "react-native";

import { ProgressBar } from "@/src/components/form";
import { Avatar, ChannelDots, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { campaignById, campaignProgress, dueLabel, formatDate, isOpen, person } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { ActivityItem, Campaign, Priority, Task } from "@/src/types";

export const MODULE_ICON: Record<Task["module"], string> = {
  Content: "document-text-outline",
  "Ad Studio": "sparkles-outline",
  Library: "calendar-outline",
  Branding: "color-palette-outline",
};

export const priorityTone = (p: Priority) => (p === "High" ? "error" : p === "Medium" ? "warning" : "neutral");

export function TaskRow({ task, showAssignee = false, showCampaign = true, last = false }: { task: Task; showAssignee?: boolean; showCampaign?: boolean; last?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useDb();
  const due = isOpen(task) ? dueLabel(task.due) : { text: `Done · ${formatDate(task.due)}`, tone: "success" as const };
  const camp = campaignById(db, task.cid);
  const meta = [showCampaign ? camp?.name ?? "No campaign" : task.module, showAssignee ? person(task.assignee).name : null].filter(Boolean).join(" · ");
  return (
    <PressableScale testID={`task-row-${task.id}`} onPress={() => router.push(`/task/${task.id}` as Href)} style={[styles.row, !last && styles.rowDivider]} scaleTo={0.985}>
      <View style={styles.iconBox}>
        <Icon name={MODULE_ICON[task.module]} size={15} color={colors.brand} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, !isOpen(task) && styles.done]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        <View style={styles.pills}>
          <Pill label={task.status} tone={statusTone(task.status)} />
          <Pill label={task.priority} tone={priorityTone(task.priority)} testID={`task-priority-${task.id}`} />
          <Pill label={due.text} tone={due.tone} />
        </View>
      </View>
      <Icon name="chevron-forward" size={14} color={colors.muted} />
    </PressableScale>
  );
}

export function CampaignRow({ campaign, last = false }: { campaign: Campaign; last?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useDb();
  const prog = campaignProgress(db, campaign.id);
  const dates = campaign.start ? `${formatDate(campaign.start)} – ${formatDate(campaign.end)}` : "Dates not set";
  return (
    <PressableScale testID={`campaign-row-${campaign.id}`} onPress={() => router.push(`/campaign/${campaign.id}` as Href)} style={[styles.row, !last && styles.rowDivider]} scaleTo={0.985}>
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceInverse }]}>
        <Icon name="megaphone-outline" size={15} color={colors.onSurfaceInverse} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {campaign.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {dates} · {campaign.team.length} people{campaign.visibility === "private" ? " · Private" : ""}
        </Text>
        <View style={styles.pills}>
          <Pill label={campaign.status} tone={statusTone(campaign.status)} />
          <ChannelDots ids={campaign.channels} />
        </View>
        <View style={styles.progRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar pct={prog.pct} />
          </View>
          <Text style={styles.progText} testID={`campaign-progress-${campaign.id}`}>
            {prog.done}/{prog.total} done
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={14} color={colors.muted} />
    </PressableScale>
  );
}

export function ActivityRow({ item, last = false }: { item: ActivityItem; last?: boolean }) {
  const styles = useStyles();
  const p = person(item.actor);
  return (
    <View testID={`activity-row-${item.id}`} style={[styles.row, !last && styles.rowDivider]}>
      <Avatar initials={p.initials} size={30} tone="soft" />
      <View style={styles.body}>
        <Text style={styles.activityText}>
          <Text style={styles.bold}>{p.name}</Text> {item.action.toLowerCase()}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.detail}
        </Text>
      </View>
      <Text style={styles.time}>{item.at}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 64 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  iconBox: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 3 },
  title: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface, lineHeight: 20 },
  done: { color: c.muted, textDecorationLine: "line-through" },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  pills: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4, flexWrap: "wrap" },
  progRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 6 },
  progText: { fontSize: fontSize.sm, color: c.muted, fontWeight: "600" },
  activityText: { fontSize: fontSize.base, color: c.onSurface, lineHeight: 19 },
  bold: { fontWeight: "700" },
  time: { fontSize: fontSize.sm, color: c.muted, alignSelf: "flex-start", maxWidth: 80, textAlign: "right" },
}));
