import { Redirect, Tabs, useRouter } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform, Text, View } from "react-native";

import { Icon, PressableScale } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { useDemo } from "@/src/state/DemoContext";
import { useTheme } from "@/src/theme";

function CreateTabButton() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <PressableScale
        testID="tab-create-button"
        accessibilityLabel="Create"
        onPress={() => router.push("/create-menu")}
        scaleTo={0.92}
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.brandPrimary,
          alignItems: "center",
          justifyContent: "center",
          marginTop: -14,
          borderWidth: 4,
          borderColor: colors.surfaceSecondary,
          shadowColor: colors.brandPrimary,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Icon name="add" size={24} color={colors.onBrandPrimary} />
      </PressableScale>
      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.brandPrimary, marginTop: 1 }}>Create</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { role } = useDemo();
  const { colors } = useTheme();
  if (!role) return <Redirect href="/" />;


  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brand}>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tasks">
          <NativeTabs.Trigger.Icon sf="checklist" />
          <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="create">
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" />
          <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="campaigns">
          <NativeTabs.Trigger.Icon sf="megaphone.fill" />
          <NativeTabs.Trigger.Label>Campaigns</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="more">
          <NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" />
          <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  const tabIcon = (on: string, off: string) =>
    function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
      return <Icon name={focused ? on : off} size={20} color={String(color)} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) },
        tabBarItemStyle: { alignSelf: "center" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarButtonTestID: "tab-home", tabBarIcon: tabIcon("home", "home-outline") }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarButtonTestID: "tab-tasks", tabBarIcon: tabIcon("checkbox", "checkbox-outline") }} />
      <Tabs.Screen name="create" options={{ title: "Create", tabBarButton: () => <CreateTabButton /> }} />
      <Tabs.Screen name="campaigns" options={{ title: "Campaigns", tabBarButtonTestID: "tab-campaigns", tabBarIcon: tabIcon("megaphone", "megaphone-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarButtonTestID: "tab-more", tabBarIcon: tabIcon("grid", "grid-outline") }} />
    </Tabs>
  );
}
