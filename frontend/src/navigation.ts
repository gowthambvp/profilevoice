import { Platform } from "react-native";

/** iOS 26+ uses native (Liquid Glass) tabs; everything else uses the JS tab bar. */
export const usesNativeTabs = Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;
