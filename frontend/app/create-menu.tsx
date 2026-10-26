import { Redirect } from "expo-router";

import { CreateOptions } from "@/src/components/CreateOptions";
import { Sheet } from "@/src/components/Sheet";
import { useDemo } from "@/src/state/DemoContext";

export default function CreateMenu() {
  const { role } = useDemo();
  if (!role) return <Redirect href="/" />;
  return (
    <Sheet testID="create-menu-sheet" title="Create" subtitle="What would you like to start?">
      <CreateOptions replace />
    </Sheet>
  );
}
