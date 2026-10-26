// List rows for tasks, campaigns and activity — shared by Home, Tasks, Campaigns and placeholders.
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Avatar, ChannelDots, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { destinationHref } from "@/src/config/modules";
import { campaignById, dueLabel, formatDate, person } from "@/src/services/dashboard";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { ActivityItem, Campaign, Task } from "@/src/types";

const MODULE_ICON: Record<Task["module"], string> = {
  Content: "document-text-outline",
  "Ad Studio": "sparkles-outline",
  Library: "calendar-outline",
  Branding: "color-palette-outline",
};

export function TaskRow({ task, showAssignee = false, last = false }: { task: Task; showAssignee?: boolean; last?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const due = dueLabel(task.due);
  const camp = campaignById(task.cid);
  return (
    <PressableScale testID={`task-row-${task.id}`} onPress={() => router.push(destinationHref("task", task.id))} style={[styles.row, !last && styles.rowDivider]} scaleTo={0.985}>
      <View style={styles.iconBox}>
        <Icon name={MODULE_ICON[task.module]} size={15} color={colors.brand} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {camp?.name ?? "No campaign"}
          {showAssignee ? ` · ${person(task.assignee).name}` : ""}
        </Text>
        <View style={styles.pills}>
          <Pill label={task.status} tone={statusTone(task.status)} />
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
  const dates = campaign.start ? `${formatDate(campaign.start)} – ${formatDate(campaign.end)}` : "Dates not set";
  return (
    <PressableScale testID={`campaign-row-${campaign.id}`} onPress={() => router.push(destinationHref("campaign", campaign.id))} style={[styles.row, !last && styles.rowDivider]} scaleTo={0.985}>
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
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  pills: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4, flexWrap: "wrap" },
  activityText: { fontSize: fontSize.base, color: c.onSurface, lineHeight: 19 },
  bold: { fontWeight: "700" },
  time: { fontSize: fontSize.sm, color: c.muted, alignSelf: "flex-start", maxWidth: 80, textAlign: "right" },
}));
