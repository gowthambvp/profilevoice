// Asset Library: filterable gallery, search, favorites and local media selection.
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fab, SearchBar, StackHeader } from "@/src/components/form";
import { EmptyState, Icon, PressableScale } from "@/src/components/ui";
import { campaignById, libraryAssets } from "@/src/services/dashboard";
import { useDb } from "@/src/state/DataStore";
import { useDemo } from "@/src/state/DemoContext";
import { fontSize, makeStyles, radius, shadow1, spacing, useTheme } from "@/src/theme";
import type { Asset } from "@/src/types";

const ASSET_ICON: Record<Asset["kind"], string> = { image: "image-outline", video: "videocam-outline", doc: "document-text-outline", post: "grid-outline" };
const FILTERS = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "doc", label: "Documents" },
  { key: "post", label: "Posts" },
  { key: "fav", label: "Favorites" },
];

export default function Library() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db, addAsset, toggleFavorite } = useDb();
  const { role, showToast } = useDemo();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(false);
  if (!role) return <Redirect href="/" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  const q = query.trim().toLowerCase();
  const all = libraryAssets(db, role).filter((a) => !q || a.name.toLowerCase().includes(q) || (campaignById(db, a.cid)?.name.toLowerCase().includes(q) ?? false));
  const match = (k: string) => (a: (typeof all)[number]) => (k === "all" ? true : k === "fav" ? db.favorites.includes(a.id) : a.kind === k);
  const list = all.filter(match(filter));

  const added = (id: string) => {
    showToast("Added to the library");
    router.push(`/asset/${id}` as Href);
  };
  // Wait for the sheet's close animation before presenting the system picker (iOS drops it otherwise).
  const afterClose = (fn: () => void) => {
    setSheet(false);
    setTimeout(fn, 400);
  };
  const pickMedia = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const video = a.type === "video";
    added(addAsset({ name: a.fileName ?? (video ? "New video" : "New image"), kind: video ? "video" : "image", uri: a.uri }, role));
  };
  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    added(addAsset({ name: res.assets[0].name, kind: "doc", uri: res.assets[0].uri }, role));
  };

  return (
    <View style={styles.root} testID="library-screen">
      <StackHeader title="Library" onBack={back} />
      <View style={styles.sticky}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SearchBar testID="library-search-input" value={query} onChangeText={setQuery} placeholder="Search assets or campaigns" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {FILTERS.map((f) => {
            const on = f.key === filter;
            return (
              <PressableScale key={f.key} testID={`library-filter-${f.key}`} onPress={() => setFilter(f.key)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f.label} {all.filter(match(f.key)).length}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 96 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {list.length ? (
          <View style={styles.grid} testID="library-grid">
            {list.map((a) => {
              const fav = db.favorites.includes(a.id);
              return (
                <PressableScale key={a.id} testID={`asset-card-${a.id}`} onPress={() => router.push(`/asset/${a.id}` as Href)} style={styles.card} scaleTo={0.97}>
                  <View style={styles.thumb}>
                    {a.uri && a.kind === "image" ? <Image source={{ uri: a.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <Icon name={ASSET_ICON[a.kind]} size={28} color={colors.onSurfaceInverse} />}
                    <Pressable testID={`asset-fav-${a.id}`} accessibilityLabel={fav ? "Remove from favorites" : "Add to favorites"} onPress={() => toggleFavorite(a.id)} style={styles.fav}>
                      <View style={styles.favDot}>
                        <Icon name={fav ? "heart" : "heart-outline"} size={16} color={fav ? colors.brandPrimary : colors.onSurface} />
                      </View>
                    </Pressable>
                  </View>
                  <Text style={styles.name} numberOfLines={2}>
                    {a.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {campaignById(db, a.cid)?.name ?? "No campaign"}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        ) : (
          <EmptyState testID="library-empty" icon="albums-outline" title={filter === "fav" ? "No favorites yet" : "No assets found"} message={filter === "fav" ? "Tap the heart on any asset to keep it here." : "Try another filter or add media from your device."} />
        )}
      </ScrollView>
      <Fab testID="library-add-button" label="Add media" icon="cloud-upload-outline" bottom={insets.bottom + spacing.lg} onPress={() => setSheet(true)} />

      <Modal transparent visible={sheet} animationType="fade" onRequestClose={() => setSheet(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSheet(false)} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} testID="library-add-sheet">
            <Text style={styles.sheetTitle}>Add to library</Text>
            <Text style={styles.meta}>Files stay on this device for the demo — nothing is uploaded.</Text>
            {[
              { k: "media", icon: "images-outline", label: "Photo or video", sub: "From your gallery", fn: pickMedia },
              { k: "doc", icon: "document-attach-outline", label: "Document", sub: "PDF, brief or brand file", fn: pickDoc },
            ].map((o) => (
              <PressableScale key={o.k} testID={`library-add-${o.k}`} onPress={() => afterClose(o.fn)} style={styles.option}>
                <View style={styles.optIcon}>
                  <Icon name={o.icon} size={19} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{o.label}</Text>
                  <Text style={styles.meta}>{o.sub}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  sticky: { paddingTop: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  chip: { height: 36, flexShrink: 0, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base - 1, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onSurfaceInverse },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "47.5%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.sm, gap: 4, ...shadow1(c) },
  thumb: { aspectRatio: 1, borderRadius: radius.md, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 4 },
  fav: { position: "absolute", top: 2, right: 2, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  favDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  meta: { fontSize: fontSize.sm, color: c.muted },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  sheet: { backgroundColor: c.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: "700", color: c.onSurface },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, minHeight: 60 },
  optIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
}));
