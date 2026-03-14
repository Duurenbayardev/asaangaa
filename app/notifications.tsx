import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BackButton } from "../components/BackButton";

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <BackButton fallbackHref="/(tabs)/home" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyWrap}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications-off-outline" size={56} color="#C0C0C0" />
          </View>
          <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй</Text>
          <Text style={styles.emptyText}>
            Шинэ захиалга, хөнгөлөлт болон бусад мэдэгдэл энд гарна.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
  },
  iconWrap: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
});
