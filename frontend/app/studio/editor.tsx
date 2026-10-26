// Draft editor shared by Content Studio and Ad Studio: setup → generate → edit → preview,
// save, copy, delete and role-aware approval actions.
import * as Clipboard from "expo-clipboard";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup, ConfirmDialog, Field, HeaderIconButton, NoAccess, Segmented, StackHeader, TextField } from "@/src/components/form";
import { DraftPreview } from "@/src/components/previews";
import { Button, Card, Icon, Pill, PressableScale, statusTone } from "@/src/components/ui";
import { ROLES, can, draftActions, draftNote, isManager } from "@/src/config/roles";
import { AD_TYPES, CONTENT_TYPES, CTAS, DURATIONS, LENGTHS, PLATFORMS, RATIOS, TONES, VOICES, charLimit, studioType } from "@/src/config/studio";
import { CHANNELS } from "@/src/data/mock";
import { visibleCampaigns } from "@/src/services/dashboard";
import { blankDraft, generateAd, generateContent } from "@/src/services/generator";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { Draft, DraftInput } from "@/src/types";

const strip = ({ id: _i, owner: _o, status: _s, updatedAt: _u, ...rest }: Draft): DraftInput => rest;

export default function StudioEditor() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; kind?: string; type?: string; cid?: string; taskId?: string }>();
  const { db, saveDraft, setDraftStatus, deleteDraft } = useDb();
  const { role, showToast } = useDemo();

  const existing = params.id ? db.drafts.find((d) => d.id === params.id) : undefined;
  const task = params.taskId ? db.tasks.find((t) => t.id === params.taskId) : undefined;
  const kind: Draft["kind"] = existing?.kind ?? (params.kind === "ads" ? "ad" : "content");
  const [savedId, setSavedId] = useState<string | null>(existing?.id ?? null);
  const [form, setForm] = useState<DraftInput>(() => (existing ? strip(existing) : blankDraft(kind, params.type, params.cid ?? task?.cid ?? null, task)));
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  if (!role) return <Redirect href="/" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (!can.useStudio(role)) return <NoAccess message="Publishers schedule approved work. Content and ads are made by Creators and managers." onBack={leave} />;
  if (params.id && !existing) return <NoAccess message="This draft no longer exists in this demo session." onBack={leave} />;

  const saved = savedId ? db.drafts.find((d) => d.id === savedId) : undefined;
  const isAd = kind === "ad";
  const editable = !saved || can.editDraft(role, saved);
  const me = ROLES[role].personId;
  const types = isAd ? AD_TYPES : CONTENT_TYPES;
  const campaigns = visibleCampaigns(db, role).filter((c) => c.status !== "Completed" || c.id === form.cid);
  const tasks = db.tasks.filter(
    (t) => t.cid === form.cid && t.module === (isAd ? "Ad Studio" : "Content") && t.status !== "Completed" && (isManager(role) || t.assignee === me),
  );
  const limit = charLimit(form.type, form.channel);
  const actions = saved ? draftActions(saved, role) : [];
  const note = saved ? draftNote(saved, role) : null;

  const set = <K extends keyof DraftInput>(k: K, v: DraftInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };
  const close = () => (dirty ? setConfirmDiscard(true) : leave());

  const generate = () => {
    const variant = form.body.trim() ? form.variant + 1 : form.variant;
    const out = isAd ? generateAd({ ...form, variant }) : generateContent({ ...form, variant });
    setForm((f) => ({ ...f, ...out, variant }));
    setDirty(true);
    setError("");
    showToast(form.body.trim() ? "New variation generated" : "Draft generated");
  };

  const persist = () => {
    const id = saveDraft(form, role, savedId);
    setSavedId(id);
    setDirty(false);
    return id;
  };
  const save = () => {
    if (!form.title.trim() && !form.body.trim()) {
      setError("Generate or write something before saving.");
      return;
    }
    setError("");
    persist();
    showToast("Draft saved");
  };
  const copy = async () => {
    const text = [form.title, form.body, isAd && form.cta ? `CTA: ${form.cta}` : ""].filter((s) => s.trim()).join("\n\n");
    if (!text) {
      showToast("Nothing to copy yet");
      return;
    }
    await Clipboard.setStringAsync(text);
    showToast("Copied to clipboard");
  };
  const act = (status: Draft["status"], label: string) => {
    if (status !== "Draft" && !form.title.trim() && !form.body.trim()) {
      setError("Add a title or body before sending this draft on.");
      setMode("write");
      showToast("Add a title or body first");
      return;
    }
    const id = dirty && editable ? persist() : (savedId as string);
    setDraftStatus(id, status, role);
    showToast(label);
  };
  const remove = () => {
    setConfirmDelete(false);
    if (savedId) deleteDraft(savedId, role);
    showToast("Draft deleted");
    leave();
  };

  const typeLabel = studioType(form.type)?.label ?? "Draft";

  return (
    <View style={styles.root} testID="studio-editor-screen">
      <StackHeader
        title={saved ? typeLabel : `New ${typeLabel.toLowerCase()}`}
        onBack={close}
        backIcon="close"
        testID="editor-close-button"
        right={saved && editable ? <HeaderIconButton testID="editor-delete-button" icon="trash-outline" label="Delete draft" onPress={() => setConfirmDelete(true)} /> : null}
      />
      <View style={styles.modeBar}>
        <Segmented
          options={[
            { key: "write", label: "Write" },
            { key: "preview", label: "Preview" },
          ]}
          value={mode}
          onChange={setMode}
          testIDPrefix="editor-mode"
        />
        <View style={styles.statusWrap}>
          {dirty ? <Text style={styles.unsaved} testID="editor-unsaved">Unsaved</Text> : null}
          <Pill label={saved?.status ?? "New"} tone={saved ? statusTone(saved.status) : "neutral"} testID="editor-status" />
        </View>
      </View>

      <KeyboardAwareScrollView key={mode} bottomOffset={100} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === "preview" ? (
          <DraftPreview draft={form} />
        ) : (
          <View style={{ gap: spacing.xl }} pointerEvents={editable ? "auto" : "none"}>
            {!editable ? (
              <View style={styles.locked} testID="editor-locked-note">
                <Icon name="lock-closed-outline" size={14} color={colors.muted} />
                <Text style={styles.lockedText}>Read-only for you while it’s {saved?.status.toLowerCase()}.</Text>
              </View>
            ) : null}
            <Field label="Format">
              <ChipGroup testIDPrefix="editor-type" options={types.map((t) => ({ key: t.id, label: t.label }))} selected={[form.type]} onToggle={(k) => set("type", k as DraftInput["type"])} />
            </Field>
            <Field label="Campaign" hint="Approved drafts are added to the campaign’s assets.">
              <ChipGroup
                testIDPrefix="editor-campaign"
                options={[{ key: "none", label: "No campaign" }, ...campaigns.map((c) => ({ key: c.id, label: c.name }))]}
                selected={[form.cid ?? "none"]}
                onToggle={(k) => {
                  set("cid", k === "none" ? null : k);
                  set("taskId", null);
                }}
              />
            </Field>
            {form.cid ? (
              <Field label="Linked task" hint={tasks.length ? "Sending for approval also moves the task." : `No open ${isAd ? "Ad Studio" : "Content"} tasks ${isManager(role) ? "in" : "assigned to you in"} this campaign.`}>
                <ChipGroup testIDPrefix="editor-task" options={[{ key: "none", label: "None" }, ...tasks.map((t) => ({ key: t.id, label: t.title }))]} selected={[form.taskId ?? "none"]} onToggle={(k) => set("taskId", k === "none" ? null : k)} />
              </Field>
            ) : null}
            <Field label="Brand voice" hint={VOICES.find((v) => v.id === form.voiceId)?.trait}>
              <ChipGroup testIDPrefix="editor-voice" options={VOICES.map((v) => ({ key: v.id, label: v.name }))} selected={[form.voiceId]} onToggle={(k) => set("voiceId", k)} />
            </Field>
            <Field label="Tone">
              <ChipGroup testIDPrefix="editor-tone" options={TONES.map((t) => ({ key: t, label: t }))} selected={[form.tone]} onToggle={(k) => set("tone", k)} />
            </Field>
            {!isAd ? (
              <Field label="Length">
                <ChipGroup testIDPrefix="editor-length" options={LENGTHS.map((l) => ({ key: l, label: l }))} selected={[form.length]} onToggle={(k) => set("length", k as DraftInput["length"])} />
              </Field>
            ) : null}
            {form.type === "post" ? (
              <Field label="Channel">
                <ChipGroup testIDPrefix="editor-channel" options={Object.values(CHANNELS).map((c) => ({ key: c.id, label: c.label }))} selected={[form.channel]} onToggle={(k) => set("channel", k)} />
              </Field>
            ) : null}
            {isAd ? (
              <Field label="Platform">
                <ChipGroup testIDPrefix="editor-platform" options={PLATFORMS.map((p) => ({ key: p, label: p }))} selected={[form.platform]} onToggle={(k) => set("platform", k)} />
              </Field>
            ) : null}
            {form.type === "imagead" || form.type === "videoad" ? (
              <Field label="Aspect ratio">
                <ChipGroup testIDPrefix="editor-ratio" options={RATIOS.map(([k, l]) => ({ key: k, label: l }))} selected={[form.ratio]} onToggle={(k) => set("ratio", k)} />
              </Field>
            ) : null}
            {form.type === "videoad" || form.type === "adscript" ? (
              <Field label="Duration">
                <ChipGroup testIDPrefix="editor-duration" options={DURATIONS.map((d) => ({ key: d, label: d }))} selected={[form.duration]} onToggle={(k) => set("duration", k)} />
              </Field>
            ) : null}
            <Field label="What is it about?">
              <TextField testID="editor-topic-input" value={form.topic} onChangeText={(v) => set("topic", v)} placeholder="e.g. Diwali gift sets under ₹999" />
            </Field>
            <Field label="Keywords" hint="Separate with commas.">
              <TextField testID="editor-keywords-input" value={form.keywords} onChangeText={(v) => set("keywords", v)} placeholder="natural ingredients, gifting, Ayurveda" autoCapitalize="none" />
            </Field>

            <PressableScale testID="editor-generate-button" onPress={generate} style={styles.generate} scaleTo={0.97}>
              <Icon name="sparkles" size={17} color={colors.onSurfaceInverse} />
              <View style={{ flex: 1 }}>
                <Text style={styles.generateTitle}>{form.body.trim() ? "Regenerate variation" : "Generate draft"}</Text>
                <Text style={styles.generateSub}>Local templates · no AI service</Text>
              </View>
              <Icon name="chevron-forward" size={15} color={colors.onSurfaceInverseMuted} />
            </PressableScale>

            <Field label={isAd ? "Headline" : "Title"} error={error} testID="editor-title-input">
              <TextField testID="editor-title-input" value={form.title} onChangeText={(v) => set("title", v)} placeholder={isAd ? "Short, punchy headline" : "Draft title"} />
            </Field>
            <Field label={form.type === "imagead" ? "Primary text" : form.type === "videoad" ? "Storyboard" : form.type === "adscript" ? "Script" : "Body"}>
              <TextField testID="editor-body-input" value={form.body} onChangeText={(v) => set("body", v)} placeholder="Generate a draft or start writing…" multiline style={{ minHeight: 200 }} />
              {limit ? (
                <Text style={[styles.counter, form.body.length > limit.limit && { color: colors.error }]} testID="editor-char-count">
                  {form.body.length}/{limit.limit} · {limit.label}
                </Text>
              ) : null}
            </Field>
            {isAd ? (
              <Field label="Call to action">
                <ChipGroup testIDPrefix="editor-cta" options={CTAS.map((c) => ({ key: c, label: c }))} selected={[form.cta]} onToggle={(k) => set("cta", k)} />
              </Field>
            ) : null}
          </View>
        )}

        {saved && (actions.length || note) ? (
          <Card style={styles.approval} testID="editor-approval-card">
            <Text style={styles.approvalTitle}>Approval</Text>
            {actions.map((a) => (
              <Button key={a.key} testID={`draft-action-${a.key}`} label={a.label} icon={a.icon} variant={a.variant} onPress={() => act(a.status, a.status === "Draft" ? "Moved back to draft" : `Status: ${a.status}`)} />
            ))}
            {note ? (
              <View style={styles.noteRow} testID="editor-approval-note">
                <Icon name="information-circle-outline" size={15} color={colors.muted} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Button testID="editor-copy-button" label="Copy" icon="copy-outline" variant="secondary" onPress={copy} />
          </View>
          {editable ? (
            <View style={{ flex: 1.4 }}>
              <Button testID="editor-save-button" label={saved ? "Save changes" : "Save draft"} icon="checkmark" onPress={save} />
            </View>
          ) : null}
        </View>
      </KeyboardStickyView>

      <ConfirmDialog visible={confirmDelete} testID="delete-draft-dialog" title="Delete this draft?" message="It will be removed from this demo session." onCancel={() => setConfirmDelete(false)} onConfirm={remove} />
      <ConfirmDialog
        visible={confirmDiscard}
        testID="discard-draft-dialog"
        title="Discard unsaved changes?"
        message="Your latest edits haven’t been saved."
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          leave();
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  modeBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  unsaved: { fontSize: fontSize.sm, color: c.warning, fontWeight: "700" },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] + 56, gap: spacing.xl },
  locked: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  lockedText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted },
  generate: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surfaceInverse },
  generateTitle: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurfaceInverse },
  generateSub: { fontSize: fontSize.sm, color: c.onSurfaceInverseMuted, marginTop: 2 },
  counter: { fontSize: fontSize.sm, color: c.muted, textAlign: "right" },
  approval: { padding: spacing.lg, gap: spacing.md },
  approvalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface },
  noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
  bar: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderTopColor: c.border },
}));
