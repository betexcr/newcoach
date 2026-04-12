import { Stack } from "expo-router";
import { DemoTooltipProvider } from "./DemoTooltip";

export default function DemoLayout() {
  return (
    <DemoTooltipProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DemoTooltipProvider>
  );
}
