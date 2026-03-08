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
import { useAuth } from "../../../context/AuthContext";
import * as adminApi from "../../../lib/admin-api";
import { formatTugrug } from "../../../lib/formatCurrency";

const THEME = "#8C1A7A";

export default function AdminOrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<adminApi.AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await adminApi.getAdminOrders(token);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Захиалга ({orders.length})</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/admin/orders/${item.id}`)}
          >
            <View style={styles.cardRow}>
              <Text style={styles.orderId}>#{item.id.slice(-8)}</Text>
              <Text style={[styles.badge, item.status === "delivered" && styles.badgeSuccess]}>{item.status}</Text>
            </View>
            <Text style={styles.email}>{item.userEmail}</Text>
            <Text style={styles.total}>{formatTugrug(item.grandTotal)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E8E8E8" },
  title: { fontSize: 18, fontWeight: "600", color: "#111" },
  list: { padding: 20, paddingBottom: 40 },
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
  badge: { fontSize: 11, fontWeight: "600", color: "#666", textTransform: "uppercase" },
  badgeSuccess: { color: "#2E7D32" },
  email: { fontSize: 13, color: "#666", marginTop: 8 },
  total: { fontSize: 16, fontWeight: "700", color: THEME, marginTop: 4 },
  date: { fontSize: 12, color: "#999", marginTop: 4 },
});
