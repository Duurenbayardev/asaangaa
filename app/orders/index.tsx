import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BackButton } from "../../components/BackButton";
import { useAuth } from "../../context/AuthContext";
import { formatTugrug } from "../../lib/formatCurrency";
import type { Order } from "../../types/api";
import { getOrders } from "../../lib/orders-api";

const THEME = "#8C1A7A";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Бэлтгэж буй",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

export default function MyOrdersScreen() {
  const { token, isRestored } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isRestored && !token) {
      router.replace("/?showLogin=1");
    }
  }, [isRestored, token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await getOrders(token);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (isRestored && !token) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <BackButton fallbackHref="/(tabs)/profile" />
        <ActivityIndicator size="large" color={THEME} style={styles.spinner} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton fallbackHref="/(tabs)/profile" />
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Захиалга байхгүй байна.</Text>
          <Text style={styles.emptySub}>Та захиалга өгснөөр энд гарна.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[THEME]}
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/orders/${item.id}`)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
                <View style={[styles.badge, item.status === "delivered" && styles.badgeSuccess]}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
              </View>
              <Text style={styles.total}>{formatTugrug(item.grandTotal)}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  centered: { flex: 1 },
  spinner: { marginTop: 24 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 17, fontWeight: "600", color: "#333" },
  emptySub: { fontSize: 14, color: "#777", marginTop: 8 },
  list: { padding: 20, paddingTop: 72, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: "600", color: "#111" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#F0E6F0" },
  badgeSuccess: { backgroundColor: "#E8F5E9" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#555" },
  total: { fontSize: 16, fontWeight: "700", color: THEME, marginTop: 8 },
  date: { fontSize: 12, color: "#999", marginTop: 4 },
});
