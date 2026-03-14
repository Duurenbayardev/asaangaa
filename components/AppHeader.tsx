import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 90;

export function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.push("/(tabs)/home")}
        style={styles.logoWrap}
        accessibilityLabel="Нүүр"
      >
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </Pressable>
      <Pressable
        onPress={() => router.push("/notifications")}
        style={styles.notifBtn}
        accessibilityLabel="Мэдэгдэл"
      >
        <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  logoWrap: {
    padding: 4,
  },
  logo: {
    width: 140,
    height: 50,
  },
  notifBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
