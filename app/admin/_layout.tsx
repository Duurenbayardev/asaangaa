import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Stack } from "expo-router";
import { Pressable } from "react-native";

function AdminHeaderBack() {
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/home");
      }}
      style={{ padding: 8, marginLeft: 4 }}
      hitSlop={10}
    >
      <Ionicons name="chevron-back" size={26} color="#111" />
    </Pressable>
  );
}

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        headerLeft: () => <AdminHeaderBack />,
        headerTitleStyle: { fontSize: 18, fontWeight: "600", color: "#111" },
        headerStyle: { backgroundColor: "#FFF" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Удирдлага" }} />
      <Stack.Screen name="products" options={{ title: "Бүтээгдэхүүн" }} />
      <Stack.Screen name="orders" options={{ title: "Захиалга", headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: "Бүтээгдэхүүн" }} />
    </Stack>
  );
}
