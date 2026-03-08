import { Stack } from "expo-router";

export default function AdminOrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Буцах",
        headerTintColor: "#8C1A7A",
        headerStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Захиалга" }} />
      <Stack.Screen name="[id]" options={{ title: "Захиалгын дэлгэрэнгүй" }} />
    </Stack>
  );
}
