import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Stack } from "expo-router";
import { Pressable } from "react-native";

function OrdersHeaderBack() {
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/admin");
      }}
      style={{ padding: 8, marginLeft: 4 }}
      hitSlop={10}
    >
      <Ionicons name="chevron-back" size={26} color="#111" />
    </Pressable>
  );
}

export default function AdminOrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        headerLeft: () => <OrdersHeaderBack />,
        headerTitleStyle: { fontSize: 18, fontWeight: "600", color: "#111" },
        headerStyle: { backgroundColor: "#FFF" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Захиалга" }} />
      <Stack.Screen name="[id]" options={{ title: "Захиалгын дэлгэрэнгүй" }} />
    </Stack>
  );
}
