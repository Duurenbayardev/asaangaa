import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Буцах",
        headerTintColor: "#8C1A7A",
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerLeft: () => (
          <Pressable onPress={() => router.replace("/(tabs)/profile")} style={{ padding: 8, marginLeft: 4 }}>
            <Ionicons name="chevron-back" size={26} color="#8C1A7A" />
          </Pressable>
        ),
      }}
    />
  );
}
