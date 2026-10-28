// Add / edit / delete a brand voice. Super Admin and Owner/Admin only.
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";

import { ConfirmDialog, Field, FormScreen, NoAccess, TextField } from "@/src/components/form";
import { Button } from "@/src/components/ui";
import { can } from "@/src/config/roles";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";

export default function VoiceEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, saveVoice, deleteVoice } = useDb();
  const { role, showToast } = useDemo();
  const existing = id ? db.voices.find((v) => v.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [trait, setTrait] = useState(existing?.trait ?? "");
  const [signoff, setSignoff] = useState(existing?.signoff ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/branding" as Href));
  if (!can.editBrand(role)) return <NoAccess message="Only a Super Admin or Owner/Admin can change brand voices." onBack={close} />;

  const isDefault = existing?.id === db.brand.defaultVoice;
  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give the voice a name.";
    else if (db.voices.some((v) => v.id !== existing?.id && v.name.toLowerCase() === name.trim().toLowerCase())) e.name = "A voice with this name already exists.";
    if (!trait.trim()) e.trait = "Describe how this voice sounds.";
    setErrors(e);
    if (Object.keys(e).length) return;
    saveVoice({ name: name.trim(), trait: trait.trim(), signoff: signoff.trim() }, role, existing?.id);
    showToast(existing ? "Voice updated" : "Voice added");
    close();
  };

  return (
    <FormScreen testID="voice-form-screen" title={existing ? "Edit brand voice" : "New brand voice"} onClose={close} onSave={save} saveLabel={existing ? "Save voice" : "Add voice"}>
      <Field label="Voice name" required error={errors.name} testID="voice-name-input">
        <TextField testID="voice-name-input" value={name} onChangeText={setName} placeholder="e.g. Herbal Care — Winter" />
      </Field>
      <Field label="How it sounds" required error={errors.trait} hint="A few words the studios use to describe the voice." testID="voice-trait-input">
        <TextField testID="voice-trait-input" value={trait} onChangeText={setTrait} placeholder="e.g. Cosy, caring, unhurried" />
      </Field>
      <Field label="Sign-off line" hint="Closes generated articles and video ads.">
        <TextField testID="voice-signoff-input" value={signoff} onChangeText={setSignoff} placeholder="e.g. Warm wishes, naturally." />
      </Field>
      {existing ? (
        isDefault ? null : <Button testID="voice-delete-button" label="Delete voice" icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} />
      ) : null}
      <ConfirmDialog
        visible={confirm}
        testID="delete-voice-dialog"
        title="Delete this voice?"
        message="Drafts using it switch to the default brand voice."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          if (existing) deleteVoice(existing.id, role);
          showToast("Voice deleted");
          close();
        }}
      />
    </FormScreen>
  );
}
