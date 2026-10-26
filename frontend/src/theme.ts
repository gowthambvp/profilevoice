// ProfileVoice design tokens. Light theme only.
// Keys match the "color" block of /app/design_guidelines.json plus a few brand extras.
// Components import `useTheme()` / `makeStyles` from here; never write color literals in screens.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#F5F8F7", // app background
  onSurface: "#0E1A19", // main text
  surfaceSecondary: "#FFFFFF", // cards
  onSurfaceSecondary: "#0E1A19",
  surfaceTertiary: "#E7F2F1", // soft teal fills, chips
  onSurfaceTertiary: "#0E2E31",
  surfaceInverse: "#0E2E31", // deep teal
  onSurfaceInverse: "#FFFFFF",
  onSurfaceInverseMuted: "rgba(255,255,255,0.72)",
  muted: "#4A5A58", // secondary text

  // Brand
  brand: "#186368", // primary teal
  onBrand: "#FFFFFF",
  brandPrimary: "#C05A2C", // rust-orange primary action
  onBrandPrimary: "#FFFFFF",
  brandPrimaryPressed: "#A94B22", // dark orange
  brandSecondary: "#1D7A80", // secondary teal
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E7F2F1", // soft teal
  onBrandTertiary: "#186368",
  deepTeal: "#0E2E31",
  onDeepTeal: "#FFFFFF",

  // Status
  success: "#257D5C",
  onSuccess: "#FFFFFF",
  successSoft: "#E3F1EA",
  warning: "#A94B22",
  onWarning: "#FFFFFF",
  warningSoft: "#FBEDE5",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorSoft: "#FBE6E4",
  info: "#186368",
  onInfo: "#FFFFFF",
  infoSoft: "#E7F2F1",
  neutralSoft: "#EEF2F1",

  // Lines & effects
  border: "#E3EAE8",
  borderStrong: "#1D7A80",
  divider: "#E3EAE8",
  scrim: "rgba(14,46,49,0.45)",
  shadow: "#0E2E31",
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 } as const;
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const fontSize = { sm: 11, base: 13, lg: 15, xl: 18, "2xl": 21, "3xl": 26 } as const;

/** Shadow tier 1 — subtle iOS card shadow */
export const shadow1 = (c: ThemeColors) => ({
  shadowColor: c.shadow,
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
});

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

type NamedStyles = { [k: string]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles>(factory: (colors: ThemeColors) => T): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
