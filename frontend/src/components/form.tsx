// Form + screen building blocks: headers, inputs, chips, date picker, dialogs, FAB, progress.
import { useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, EmptyState, Icon, PressableScale } from "@/src/components/ui";
import { DEMO_TODAY } from "@/src/data/mock";
import { fontSize, makeStyles, radius, shadow1, spacing, useTheme } from "@/src/theme";

const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const toggleIn = (list: string[], k: string) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function StackHeader({ title, onBack, right, backIcon = "chevron-back", testID = "header-back-button" }: { title: string; onBack: () => void; right?: ReactNode; backIcon?: string; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <PressableScale testID={testID} accessibilityLabel={backIcon === "close" ? "Close" : "Back"} onPress={onBack} style={styles.headerBtn} scaleTo={0.92}>
        <Icon name={backIcon} size={20} color={colors.onSurface} />
      </PressableScale>
      <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function HeaderIconButton({ icon, onPress, testID, label }: { icon: string; onPress: () => void; testID: string; label: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} accessibilityLabel={label} onPress={onPress} style={styles.headerBtn} scaleTo={0.92}>
      <Icon name={icon} size={19} color={colors.brand} />
    </PressableScale>
  );
}

export function FormScreen({ title, onClose, onSave, saveLabel, children, testID }: { title: string; onClose: () => void; onSave: () => void; saveLabel: string; children: ReactNode; testID: string }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root} testID={testID}>
      <StackHeader title={title} onBack={onClose} backIcon="close" testID="form-close-button" />
      <KeyboardAwareScrollView bottomOffset={100} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {children}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="form-save-button" label={saveLabel} icon="checkmark" onPress={onSave} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

export function Field({ label, required, error, hint, children, testID }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.brandPrimary }}> *</Text> : null}
      </Text>
      {children}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text testID={testID ? `${testID}-error` : undefined} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function TextField({ multiline, style, ...rest }: TextInputProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <TextInput placeholderTextColor={colors.muted} multiline={multiline} style={[styles.input, multiline && styles.multiline, style]} {...rest} />;
}

export function ChipGroup({ options, selected, onToggle, testIDPrefix }: { options: { key: string; label: string; hint?: string }[]; selected: string[]; onToggle: (k: string) => void; testIDPrefix: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <PressableScale key={o.key} testID={`${testIDPrefix}-${o.key}`} accessibilityState={{ selected: on }} onPress={() => onToggle(o.key)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
            {on ? <Icon name="checkmark" size={13} color={colors.onSurfaceInverse} /> : null}
            <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
            {o.hint ? <Text style={[styles.chipHint, on && { color: colors.onSurfaceInverseMuted }]}>{o.hint}</Text> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

export function Segmented<K extends string>({ options, value, onChange, testIDPrefix }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; testIDPrefix: string }) {
  const styles = useStyles();
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} testID={`${testIDPrefix}-${o.key}`} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.key)} style={[styles.segItem, on && styles.segOn]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder, testID }: { value: string; onChangeText: (s: string) => void; placeholder: string; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.search}>
      <Icon name="search" size={16} color={colors.muted} />
      <TextInput testID={testID} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} returnKeyType="search" autoCorrect={false} />
      {value ? (
        <Pressable testID={`${testID}-clear`} onPress={() => onChangeText("")} hitSlop={10} accessibilityLabel="Clear search">
          <Icon name="close-circle" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Calendar({ value, onChange, testID }: { value: string; onChange: (iso: string) => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const base = value || DEMO_TODAY;
  const [ym, setYm] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });
  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const quick: [string, number][] = [["Today", 0], ["Tomorrow", 1], ["In a week", 7]];
  return (
    <View testID={testID} style={styles.cal}>
      <View style={styles.calHead}>
        <Pressable testID={`${testID}-prev`} onPress={() => shift(-1)} style={styles.calNav} accessibilityLabel="Previous month">
          <Icon name="chevron-back" size={16} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.calTitle}>{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</Text>
        <Pressable testID={`${testID}-next`} onPress={() => shift(1)} style={styles.calNav} accessibilityLabel="Next month">
          <Icon name="chevron-forward" size={16} color={colors.onSurface} />
        </Pressable>
      </View>
      <View style={styles.calGrid}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Text key={`h${i}`} style={styles.calDow}>
            {d}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.calCell} />;
          const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
          const on = iso === value;
          return (
            <Pressable key={i} testID={`${testID}-day-${iso}`} onPress={() => onChange(iso)} style={styles.calCell} accessibilityLabel={iso}>
              <View style={[styles.calDay, iso === DEMO_TODAY && styles.calToday, on && styles.calOn]}>
                <Text style={[styles.calDayText, on && { color: colors.onBrandPrimary, fontWeight: "700" }]}>{d}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quickRow}>
        {quick.map(([l, n]) => (
          <Pressable key={l} testID={`${testID}-quick-${n}`} onPress={() => onChange(addDays(DEMO_TODAY, n))} style={styles.quick}>
            <Text style={styles.quickText}>{l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function DateField({ value, onChange, testID, placeholder = "Pick a date" }: { value: string; onChange: (iso: string) => void; testID: string; placeholder?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.sm }}>
      <PressableScale testID={testID} onPress={() => setOpen((o) => !o)} style={[styles.input, styles.dateBtn]} scaleTo={0.99}>
        <Icon name="calendar-outline" size={16} color={colors.brand} />
        <Text style={[styles.dateText, !value && { color: colors.muted }]}>{value ? longDate(value) : placeholder}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} />
      </PressableScale>
      {open ? (
        <Calendar
          value={value}
          testID={`${testID}-calendar`}
          onChange={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

export function ConfirmDialog({ visible, title, message, confirmLabel = "Delete", onConfirm, onCancel, testID = "confirm-dialog" }: { visible: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dlgRoot}>
        <Pressable style={styles.dlgBackdrop} onPress={onCancel} accessibilityLabel="Cancel" />
        <View testID={testID} style={styles.dlg}>
          <View style={styles.dlgIcon}>
            <Icon name="trash-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.dlgTitle}>{title}</Text>
          <Text style={styles.dlgMsg}>{message}</Text>
          <View style={styles.dlgRow}>
            <Pressable testID={`${testID}-cancel`} onPress={onCancel} style={[styles.dlgBtn, styles.dlgCancel]}>
              <Text style={styles.dlgCancelText}>Cancel</Text>
            </Pressable>
            <Pressable testID={`${testID}-confirm`} onPress={onConfirm} style={[styles.dlgBtn, { backgroundColor: colors.error }]}>
              <Text style={styles.dlgConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Fab({ label, onPress, testID, bottom, icon = "add" }: { label: string; onPress: () => void; testID: string; bottom: number; icon?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} onPress={onPress} style={[styles.fab, { bottom }]} scaleTo={0.94}>
      <Icon name={icon} size={19} color={colors.onBrandPrimary} />
      <Text style={styles.fabText}>{label}</Text>
    </PressableScale>
  );
}

export function ProgressBar({ pct, inverse = false, testID }: { pct: number; inverse?: boolean; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ height: 6, borderRadius: 3, backgroundColor: inverse ? "rgba(255,255,255,0.18)" : colors.neutralSoft, overflow: "hidden" }}>
      <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", borderRadius: 3, backgroundColor: colors.brandPrimary }} />
    </View>
  );
}

export function NoAccess({ message, onBack }: { message: string; onBack: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.root} testID="no-access-screen">
      <StackHeader title="Not available" onBack={onBack} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <EmptyState icon="lock-closed-outline" title="Not available for this role" message={message} />
        <Button testID="no-access-back-button" label="Back" icon="arrow-back" onPress={onBack} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface },
  headerRight: { minWidth: 44, flexDirection: "row", justifyContent: "flex-end" },
  formContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] + 48, gap: spacing.xl },
  saveBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderTopColor: c.border },
  label: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  hint: { fontSize: fontSize.sm, color: c.muted },
  error: { fontSize: fontSize.sm, color: c.error, fontWeight: "600" },
  input: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: spacing.md, fontSize: fontSize.lg, color: c.onSurface },
  multiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { minHeight: 44, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  chipOn: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  chipText: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurface, flexShrink: 1 },
  chipTextOn: { color: c.onSurfaceInverse },
  chipHint: { fontSize: fontSize.sm, color: c.muted },
  seg: { flexDirection: "row", backgroundColor: c.neutralSoft, borderRadius: radius.md, padding: 3 },
  segItem: { height: 38, paddingHorizontal: spacing.md, borderRadius: radius.sm + 2, justifyContent: "center" },
  segOn: { backgroundColor: c.surfaceSecondary, ...shadow1(c) },
  segText: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.muted },
  segTextOn: { color: c.onSurface },
  search: { flexDirection: "row", alignItems: "center", gap: spacing.sm, height: 44, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, fontSize: fontSize.lg - 1, color: c.onSurface, height: 44, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dateText: { flex: 1, fontSize: fontSize.lg - 1, color: c.onSurface },
  cal: { borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, padding: spacing.md },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  calNav: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.neutralSoft },
  calTitle: { fontSize: fontSize.lg - 1, fontWeight: "700", color: c.onSurface },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calDow: { width: "14.2857%", textAlign: "center", fontSize: fontSize.sm, color: c.muted, fontWeight: "600", paddingVertical: 4 },
  calCell: { width: "14.2857%", height: 40, alignItems: "center", justifyContent: "center" },
  calDay: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  calToday: { borderWidth: 1, borderColor: c.brand },
  calOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  calDayText: { fontSize: fontSize.base, color: c.onSurface },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  quick: { flex: 1, height: 36, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  quickText: { fontSize: fontSize.sm + 1, fontWeight: "600", color: c.onBrandTertiary },
  dlgRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  dlgBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  dlg: { width: "100%", maxWidth: 360, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  dlgIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.errorSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  dlgTitle: { fontSize: fontSize.xl, fontWeight: "700", color: c.onSurface },
  dlgMsg: { fontSize: fontSize.base, color: c.muted, lineHeight: 19 },
  dlgRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  dlgBtn: { flex: 1, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  dlgCancel: { backgroundColor: c.neutralSoft },
  dlgCancelText: { fontSize: fontSize.lg - 1, fontWeight: "700", color: c.onSurface },
  dlgConfirmText: { fontSize: fontSize.lg - 1, fontWeight: "700", color: c.onError },
  fab: { position: "absolute", right: spacing.lg, height: 50, borderRadius: radius.pill, paddingHorizontal: spacing.xl, backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", gap: spacing.sm, shadowColor: c.brandPrimary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabText: { color: c.onBrandPrimary, fontSize: fontSize.lg - 1, fontWeight: "700" },
}));
