import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { formatTugrug } from "../../lib/formatCurrency";
import type { Order } from "../../types/api";
import { getOrder } from "../../lib/orders-api";

const THEME = "#8C1A7A";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Бэлтгэж буй",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/orders");
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const o = await getOrder(token, id);
      setOrder(o ?? null);
    } catch {
      setOrder(null);
    }
  }, [token, id]);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      return;
    }
    load();
  }, [load, id]);

  if (order === undefined) {
    return (
      <View style={styles.container}>
        <Header
          title="Захиалгын дэлгэрэнгүй"
          leftElement={
            <Pressable onPress={goBack} style={styles.backBtn} hitSlop={16}>
              <Ionicons name="chevron-back" size={22} color="#111111" />
            </Pressable>
          }
        />
        <ActivityIndicator size="large" color={THEME} style={styles.spinner} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Header
          title="Захиалга"
          leftElement={
            <Pressable onPress={goBack} style={styles.backBtn} hitSlop={16}>
              <Ionicons name="chevron-back" size={22} color="#111111" />
            </Pressable>
          }
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>Захиалга олдсонгүй.</Text>
        </View>
      </View>
    );
  }

  const createdDate = new Date(order.createdAt).toLocaleString("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const addr = order.address as { fullName?: string; line1?: string; line2?: string; city?: string; postalCode?: string; instructions?: string } | undefined;

  return (
    <View style={styles.container}>
      <Header
        title={`#${order.id.slice(-8).toUpperCase()}`}
        leftElement={
          <Pressable onPress={goBack} style={styles.backBtn} hitSlop={16}>
            <Ionicons name="chevron-back" size={22} color="#111111" />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Төлөв</Text>
          <View style={[styles.badge, order.status === "delivered" && styles.badgeSuccess]}>
            <Text style={styles.badgeText}>{STATUS_LABELS[order.status] ?? order.status}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Огноо</Text>
          <Text style={styles.value}>{createdDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>Бүтээгдэхүүн</Text>
        <View style={styles.card}>
          {order.lines.map((line, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineText} numberOfLines={1}>
                {line.quantity} × {line.productName}
              </Text>
              <Text style={styles.lineTotal}>{formatTugrug(line.total)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Хаяг</Text>
        <View style={styles.card}>
          {addr && (
            <Text style={styles.addressText}>
              {addr.fullName || ""}
              {"\n"}
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}
              {"\n"}
              {addr.city}
              {addr.postalCode ? ` ${addr.postalCode}` : ""}
              {addr.instructions ? `\n${addr.instructions}` : ""}
            </Text>
          )}
        </View>

        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Дэд дүн</Text>
            <Text style={styles.totalsValue}>{formatTugrug(order.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Татвар</Text>
            <Text style={styles.totalsValue}>{formatTugrug(order.tax)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Хүргэлт</Text>
            <Text style={styles.totalsValue}>{formatTugrug(order.delivery)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Нийт</Text>
            <Text style={styles.grandTotalValue}>{formatTugrug(order.grandTotal)}</Text>
          </View>
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  backBtn: { padding: 12, marginLeft: -4, minWidth: 44, minHeight: 44, justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { fontSize: 15, color: "#666" },
  spinner: { marginTop: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  statusLabel: { fontSize: 14, color: "#666" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F0E6F0" },
  badgeSuccess: { backgroundColor: "#E8F5E9" },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#555" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 14, fontWeight: "500", color: "#111" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#777", marginBottom: 8, marginTop: 16, textTransform: "uppercase" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  lineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  lineText: { flex: 1, fontSize: 14, color: "#333", marginRight: 12 },
  lineTotal: { fontSize: 14, fontWeight: "600", color: "#111" },
  addressText: { fontSize: 14, color: "#555", lineHeight: 22 },
  totalsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalsLabel: { fontSize: 14, color: "#666" },
  totalsValue: { fontSize: 14, color: "#111" },
  grandTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EEE" },
  grandTotalLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
  grandTotalValue: { fontSize: 18, fontWeight: "700", color: THEME },
});
