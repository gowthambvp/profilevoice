// Asset detail: preview, rename, favorite, campaign association, source link and delete.
import { Image } from "expo-image";
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup, ConfirmDialog, Field, HeaderIconButton, NoAccess, StackHeader, TextField } from "@/src/components/form";
import { Button, Card, Icon, PressableScale } from "@/src/components/ui";
import { ROLES, isManager } from "@/src/config/roles";
import { campaignById, findAsset, person, visibleCampaigns } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import type { Asset } from "@/src/types";

const ASSET_ICON: Record<Asset["kind"], string> = { image: "image-outline", video: "videocam-outline", doc: "document-text-outline", post: "grid-outline" };

export default function AssetDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, renameAsset, moveAsset, deleteAsset, toggleFavorite } = useDb();
  const { role, showToast } = useDemo();
  const asset = findAsset(db, id);
  const [name, setName] = useState(asset?.name ?? "");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/library" as Href));
  if (!asset) return <NoAccess message="This asset no longer exists in this demo session." onBack={back} />;

  const canEdit = isManager(role) || asset.addedBy === ROLES[role].personId;
  const fav = db.favorites.includes(asset.id);
  const sourceTask = asset.from ? db.tasks.find((t) => t.id === asset.from) : undefined;
  const sourceDraft = asset.from ? db.drafts.find((d) => d.id === asset.from) : undefined;
  const campaigns = visibleCampaigns(db, role);

  const saveName = () => {
    if (!name.trim()) return setError("Give the asset a name.");
    renameAsset(asset.id, name.trim());
    setError("");
    showToast("Asset renamed");
  };

  return (
    <View style={styles.root} testID="asset-detail-screen">
      <StackHeader
        title="Asset"
        onBack={back}
        right={<HeaderIconButton testID="asset-detail-fav" icon={fav ? "heart" : "heart-outline"} label="Favorite" onPress={() => { toggleFavorite(asset.id); showToast(fav ? "Removed from favorites" : "Added to favorites"); }} />}
      />
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
        <View style={styles.preview} testID="asset-preview">
          {asset.uri && asset.kind === "image" ? (
            <Image source={{ uri: asset.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <>
              <Icon name={asset.kind === "video" ? "play-circle" : ASSET_ICON[asset.kind]} size={44} color={colors.onSurfaceInverse} />
              <Text style={styles.previewText}>{asset.uri ? "Stored on this device" : "Preview not available in the demo"}</Text>
            </>
          )}
        </View>

        <Card style={styles.pad}>
          {canEdit ? (
            <Field label="Name" error={error} testID="asset-name-input">
              <TextField testID="asset-name-input" value={name} onChangeText={setName} />
              {name.trim() !== asset.name ? <Button testID="asset-rename-button" label="Save name" variant="secondary" onPress={saveName} /> : null}
            </Field>
          ) : (
            <Text style={styles.title} testID="asset-name">{asset.name}</Text>
          )}
          {[
            ["Type", asset.kind === "doc" ? "Document" : asset.kind[0].toUpperCase() + asset.kind.slice(1)],
            ["Added by", person(asset.addedBy).name],
            ["Campaign", campaignById(db, asset.cid)?.name ?? "Not linked"],
          ].map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.label}>{k}</Text>
              <Text style={styles.value} testID={`asset-${k.toLowerCase().replace(" ", "-")}`}>{v}</Text>
            </View>
          ))}
          {sourceTask || sourceDraft ? (
            <PressableScale testID="asset-source-link" onPress={() => router.push((sourceTask ? `/task/${sourceTask.id}` : `/studio/editor?id=${sourceDraft!.id}`) as Href)} style={styles.link} scaleTo={0.97}>
              <Icon name="link-outline" size={14} color={colors.brand} />
              <Text style={styles.linkText} numberOfLines={1}>From {sourceTask ? "task" : "draft"}: {sourceTask?.title ?? sourceDraft?.title}</Text>
            </PressableScale>
          ) : null}
        </Card>

        {canEdit ? (
          <Card style={styles.pad}>
            <Field label="Campaign association" hint="Linked assets appear on the campaign’s detail screen.">
              <ChipGroup
                testIDPrefix="asset-campaign"
                options={[{ key: "none", label: "Not linked" }, ...campaigns.map((c) => ({ key: c.id, label: c.name }))]}
                selected={[asset.cid ?? "none"]}
                onToggle={(k) => {
                  const cid = k === "none" ? null : k;
                  if (cid === asset.cid) return;
                  moveAsset(asset.id, cid, role);
                  showToast(cid ? "Linked to campaign" : "Unlinked from campaign");
                }}
              />
            </Field>
            <Button testID="asset-delete-button" label="Delete asset" icon="trash-outline" variant="ghost" onPress={() => setConfirm(true)} />
          </Card>
        ) : (
          <Text style={styles.label} testID="asset-readonly-note">Only the person who added it or a manager can change this asset.</Text>
        )}
      </KeyboardAwareScrollView>
      <ConfirmDialog
        visible={confirm}
        testID="delete-asset-dialog"
        title="Delete this asset?"
        message={`“${asset.name}” will be removed from the library and its campaign.`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          back();
          deleteAsset(asset.id, role);
          showToast("Asset deleted");
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  preview: { aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center", overflow: "hidden", gap: spacing.sm },
  previewText: { fontSize: fontSize.sm, color: c.onSurfaceInverseMuted },
  pad: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { fontSize: fontSize.base, color: c.muted, fontWeight: "600" },
  value: { fontSize: fontSize.base, color: c.onSurface, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  linkText: { flex: 1, fontSize: fontSize.sm + 1, color: c.brand, fontWeight: "600" },
}));
