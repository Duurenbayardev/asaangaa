import { router } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const THEME = "#8C1A7A";

export default function AdminDashboard() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Зөвшөөрөлгүй</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Удирдлага</Text>
      <Text style={styles.subtitle}>Админ: {user.email}</Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/admin/products")}
      >
        <Ionicons name="cube-outline" size={32} color={THEME} />
        <Text style={styles.cardTitle}>Бүтээгдэхүүн</Text>
        <Text style={styles.cardSub}>Нэмэх, засах, устгах</Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/admin/orders")}
      >
        <Ionicons name="receipt-outline" size={32} color={THEME} />
        <Text style={styles.cardTitle}>Захиалга</Text>
        <Text style={styles.cardSub}>Бүх захиалга харах</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginTop: 12,
  },
  cardSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  error: {
    fontSize: 16,
    color: "#B00020",
    textAlign: "center",
    marginTop: 40,
  },
});
