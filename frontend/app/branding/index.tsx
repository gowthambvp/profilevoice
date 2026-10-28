// Branding: brand kit, brand voices and local voice preferences used by the studios.
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup, Field, NoAccess, StackHeader, TextField } from "@/src/components/form";
import { Button, Card, Icon, Pill, PressableScale, SectionHeader } from "@/src/components/ui";
import { can } from "@/src/config/roles";
import { TONES } from "@/src/config/studio";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function Branding() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db, updateBrand } = useDb();
  const { role, showToast } = useDemo();
  const b = db.brand;
  const [form, setForm] = useState({ name: b.name, tagline: b.tagline, defaultVoice: b.defaultVoice, defaultTone: b.defaultTone, avoidWords: b.avoidWords, hashtags: b.hashtags });
  const [error, setError] = useState("");
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  if (role === "publisher") return <NoAccess message="Branding is managed by Super Admins and Owner/Admins, and used by Creators." onBack={back} />;

  const edit = can.editBrand(role);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== b[k]);
  // The default voice may have been deleted since the form was opened.
  const voiceId = db.voices.some((v) => v.id === form.defaultVoice) ? form.defaultVoice : b.defaultVoice;
  const save = () => {
    if (!form.name.trim()) return setError("Give the brand a name.");
    setError("");
    const clean = { ...form, defaultVoice: voiceId, name: form.name.trim(), tagline: form.tagline.trim(), avoidWords: form.avoidWords.trim(), hashtags: form.hashtags.trim() };
    updateBrand(clean, role);
    setForm(clean);
    showToast("Brand settings saved");
  };

  return (
    <View style={styles.root} testID="branding-screen">
      <StackHeader title="Branding" onBack={back} />
      <KeyboardAwareScrollView bottomOffset={80} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] }} showsVerticalScrollIndicator={false}>
        <Card style={styles.kit} testID="brand-kit">
          <Text style={styles.kitName} testID="brand-name">{b.name}</Text>
          <Text style={styles.kitTag}>{b.tagline}</Text>
          <View style={styles.swatches}>
            {b.colors.map((c) => (
              <View key={c.hex} style={{ alignItems: "center", gap: 4, flex: 1 }}>
                {/* Brand swatch colours are the brand's own values, identical in any theme. */}
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                <Text style={styles.swatchLabel} numberOfLines={1}>{c.label}</Text>
                <Text style={styles.swatchHex}>{c.hex}</Text>
              </View>
            ))}
          </View>
        </Card>
        {!edit ? (
          <View style={styles.note} testID="brand-readonly-note">
            <Icon name="lock-closed-outline" size={14} color={colors.muted} />
            <Text style={styles.noteText}>View only. A Super Admin or Owner/Admin can change the brand. Your studios use these settings.</Text>
          </View>
        ) : null}

        <SectionHeader title="Brand voices" actionLabel={edit ? "Add voice" : undefined} onAction={edit ? () => router.push("/branding/voice" as Href) : undefined} testID="brand-add-voice" />
        <Card testID="brand-voices">
          {db.voices.map((v, i) => (
            <PressableScale key={v.id} testID={`brand-voice-${v.id}`} disabled={!edit} onPress={() => router.push(`/branding/voice?id=${v.id}` as Href)} style={[styles.row, i < db.voices.length - 1 && styles.divider]} scaleTo={0.985}>
              <View style={styles.icon}>
                <Icon name="mic-outline" size={15} color={colors.brand} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>{v.name}</Text>
                <Text style={styles.meta}>{v.trait}</Text>
                <Text style={styles.signoff}>“{v.signoff}”</Text>
              </View>
              {v.id === b.defaultVoice ? <Pill label="Default" tone="info" /> : null}
              {edit ? <Icon name="chevron-forward" size={14} color={colors.muted} /> : null}
            </PressableScale>
          ))}
        </Card>

        <SectionHeader title="Voice preferences" />
        <Card style={styles.pad} testID="brand-preferences">
          {edit ? (
            <>
              <Field label="Brand name" required error={error} testID="brand-name-input">
                <TextField testID="brand-name-input" value={form.name} onChangeText={(t) => set("name", t)} />
              </Field>
              <Field label="Tagline">
                <TextField testID="brand-tagline-input" value={form.tagline} onChangeText={(t) => set("tagline", t)} />
              </Field>
              <Field label="Default brand voice" hint="New studio drafts start with this voice.">
                <ChipGroup testIDPrefix="brand-default-voice" options={db.voices.map((v) => ({ key: v.id, label: v.name }))} selected={[voiceId]} onToggle={(k) => set("defaultVoice", k)} />
              </Field>
              <Field label="Default tone">
                <ChipGroup testIDPrefix="brand-default-tone" options={TONES.map((t) => ({ key: t, label: t }))} selected={[form.defaultTone]} onToggle={(k) => set("defaultTone", k)} />
              </Field>
              <Field label="Words to avoid" hint="Comma separated. Generated drafts leave these out.">
                <TextField testID="brand-avoid-input" value={form.avoidWords} onChangeText={(t) => set("avoidWords", t)} placeholder="e.g. cheap, chemical" autoCapitalize="none" />
              </Field>
              <Field label="Default hashtags" hint="Added to generated social posts.">
                <TextField testID="brand-hashtags-input" value={form.hashtags} onChangeText={(t) => set("hashtags", t)} placeholder="#herbalcare" autoCapitalize="none" />
              </Field>
              <Button testID="brand-save-button" label={dirty ? "Save preferences" : "Saved"} icon="checkmark" variant={dirty ? "primary" : "secondary"} onPress={dirty ? save : () => {}} />
            </>
          ) : (
            [
              ["Default voice", db.voices.find((v) => v.id === b.defaultVoice)?.name ?? "—"],
              ["Default tone", b.defaultTone],
              ["Words to avoid", b.avoidWords || "None"],
              ["Default hashtags", b.hashtags || "None"],
            ].map(([k, v]) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.label}>{k}</Text>
                <Text style={styles.value} testID={`brand-pref-${k.toLowerCase().replace(/ /g, "-")}`}>{v}</Text>
              </View>
            ))
          )}
        </Card>
        <Text style={styles.foot}>Saved for this demo session only.</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  kit: { padding: spacing.lg, gap: spacing.xs, backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  kitName: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurfaceInverse, letterSpacing: -0.4 },
  kitTag: { fontSize: fontSize.base, color: c.onSurfaceInverseMuted },
  swatches: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  swatch: { width: "100%", height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: c.onSurfaceInverseMuted },
  swatchLabel: { fontSize: 10, color: c.onSurfaceInverse, fontWeight: "600" },
  swatchHex: { fontSize: 9, color: c.onSurfaceInverseMuted },
  note: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.neutralSoft },
  noteText: { flex: 1, fontSize: fontSize.sm + 1, color: c.muted, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: c.divider },
  icon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.base + 1, fontWeight: "700", color: c.onSurface },
  meta: { fontSize: fontSize.sm + 1, color: c.muted },
  signoff: { fontSize: fontSize.sm + 1, color: c.onSurface, fontStyle: "italic" },
  pad: { padding: spacing.lg, gap: spacing.xl },
  kv: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { fontSize: fontSize.base, color: c.muted, fontWeight: "600" },
  value: { fontSize: fontSize.base, color: c.onSurface, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  foot: { fontSize: fontSize.sm, color: c.muted, textAlign: "center", marginTop: spacing.lg },
}));
