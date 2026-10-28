// Approval queues: Pending / Approved / Rejected for tasks and unlinked studio drafts.
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Segmented, StackHeader } from "@/src/components/form";
import { Card, EmptyState, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { isManager, moduleLabel } from "@/src/config/roles";
import { approvalQueues, campaignById, person, type Queue } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function Approvals() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db } = useDb();
  const { role } = useDemo();
  const [queue, setQueue] = useState<Queue>("pending");
  if (!role) return <Redirect href="/" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  const queues = approvalQueues(db, role);
  const list = queues[queue];
  const mineOnly = role === "editor";
  const EMPTY: Record<Queue, [string, string]> = {
    pending: [mineOnly ? "Nothing waiting on review" : "All caught up", mineOnly ? "Work you send for approval appears here." : "New submissions will appear here."],
    approved: ["No approved work yet", "Approved work appears here with the reviewer’s note."],
    rejected: ["Nothing sent back", "Work returned with feedback appears here."],
  };

  return (
    <View style={styles.root} testID="approvals-screen">
      <StackHeader title={moduleLabel("approvals", role)} onBack={back} />
      <View style={styles.bar}>
        <Segmented
          testIDPrefix="approvals-queue"
          value={queue}
          onChange={setQueue}
          options={[
            { key: "pending", label: `Pending ${queues.pending.length}` },
            { key: "approved", label: `Approved ${queues.approved.length}` },
            { key: "rejected", label: `Rejected ${queues.rejected.length}` },
          ]}
        />
        <Text style={styles.scope}>{mineOnly ? "Your submissions" : isManager(role) ? "Tasks and studio drafts across the workspace" : "Tasks you can review"}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        <Card testID={`approvals-list-${queue}`}>
          {list.length ? (
            list.map((i, idx) => (
              <PressableScale key={`${i.kind}-${i.id}`} testID={`approval-item-${i.id}`} onPress={() => router.push(`/review?kind=${i.kind}&id=${i.id}` as Href)} style={[styles.row, idx < list.length - 1 && styles.divider]} scaleTo={0.985}>
                <View style={styles.icon}>
                  <Icon name={i.kind === "draft" ? "document-text-outline" : "checkbox-outline"} size={15} color={colors.brand} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {i.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[i.kind === "draft" ? `${i.module} draft` : i.module, person(i.owner).name, campaignById(db, i.cid)?.name].filter(Boolean).join(" · ")}
                  </Text>
                  {queue !== "pending" && i.decision?.note ? (
                    <Text style={[styles.note, queue === "rejected" && { color: colors.error }]} numberOfLines={2}>
                      “{i.decision.note}” — {person(i.decision.by).name}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    <Pill label={queue === "rejected" ? "Rejected" : i.status} tone={queue === "rejected" ? "error" : statusTone(i.status)} />
                    <Text style={styles.meta}>{(queue === "pending" ? i.submitted : i.decision)?.at ?? "Recently"}</Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={14} color={colors.muted} />
              </PressableScale>
            ))
          ) : (
            <EmptyState testID="approvals-empty" icon="checkmark-done-outline" title={EMPTY[queue][0]} message={EMPTY[queue][1]} />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  bar: { padding: spacing.lg, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  scope: { fontSize: fontSize.sm, color: c.muted },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  icon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  title: { fontSize: fontSize.base + 1, fontWeight: "600", color: c.onSurface },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  note: { fontSize: fontSize.sm + 1, color: c.onSurface, fontStyle: "italic" },
}));
