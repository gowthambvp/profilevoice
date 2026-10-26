import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { Toast } from "@/src/components/Toast";
import { queryClient } from "@/src/query-client";
import { DataProvider } from "@/src/state/DataStore";
import { DemoProvider } from "@/src/state/DemoContext";
import { useTheme } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const { colors } = useTheme();
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <DemoProvider>
              <DataProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
                <Stack.Screen name="index" options={{ animation: "fade" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                <Stack.Screen name="module/[key]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="campaign/[id]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="task/[id]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="campaign/edit" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="task/edit" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="studio/[kind]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="studio/editor" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="create-menu" options={{ presentation: "transparentModal", animation: "none", contentStyle: { backgroundColor: "transparent" } }} />
                <Stack.Screen name="role-switcher" options={{ presentation: "transparentModal", animation: "none", contentStyle: { backgroundColor: "transparent" } }} />
              </Stack>
              <Toast />
              </DataProvider>
            </DemoProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
