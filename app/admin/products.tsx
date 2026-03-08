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
import { useAuth } from "../../context/AuthContext";
import * as adminApi from "../../lib/admin-api";
import { formatTugrug } from "../../lib/formatCurrency";
import type { Product } from "../../types/api";

const THEME = "#8C1A7A";

export default function AdminProductsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await adminApi.getAdminProducts(token);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await adminApi.deleteProduct(token, id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setDeletingId(null);
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Бүтээгдэхүүн ({items.length})</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push({ pathname: "/admin/product/[id]", params: { id: "new" } })}
        >
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addBtnText}>Нэмэх</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME]} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.rowContent}
              onPress={() => router.push({ pathname: "/admin/product/[id]", params: { id: item.id } })}
            >
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.category} · {formatTugrug(Number(item.price))}</Text>
            </Pressable>
            <Pressable
              style={[styles.delBtn, deletingId === item.id && styles.delBtnDisabled]}
              onPress={() => handleDelete(item.id)}
              disabled={deletingId !== null}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="#B00020" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#B00020" />
              )}
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  title: { fontSize: 18, fontWeight: "600", color: "#111" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  list: { padding: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  rowContent: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: "600", color: "#111" },
  rowMeta: { fontSize: 13, color: "#666", marginTop: 4 },
  delBtn: { padding: 8 },
  delBtnDisabled: { opacity: 0.6 },
});
