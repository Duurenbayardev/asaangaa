import {
  getAdminOrder,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatus,
} from "../../../lib/admin-api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { formatTugrug } from "../../../lib/formatCurrency";

const THEME = "#8C1A7A";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "confirmed", label: "Баталгаажсан" },
  { value: "processing", label: "Бэлтгэж буй" },
  { value: "shipped", label: "Илгээгдсэн" },
  { value: "delivered", label: "Хүргэгдсэн" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

export default function AdminOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { token } = useAuth();
  const [order, setOrder] = useState<AdminOrder | null | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const o = await getAdminOrder(token, id);
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

  const handleStatusChange = async (status: OrderStatus): Promise<void> => {
    if (!token || !id || order?.status === status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(token, id, status);
      setOrder(updated);
    } catch {
      // keep current order
    } finally {
      setUpdating(false);
    }
  };

  if (order === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Захиалга олдсонгүй.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const createdDate = new Date(order.createdAt).toLocaleString("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const addr = order.address as { fullName?: string; line1?: string; line2?: string; city?: string; postalCode?: string; phone?: string; instructions?: string } | undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.date}>{createdDate}</Text>
      </View>

      <Text style={styles.sectionTitle}>Хэрэглэгч</Text>
      <View style={styles.card}>
        <Text style={styles.userEmail}>{order.userEmail}</Text>
        {order.userName ? <Text style={styles.userName}>{order.userName}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Төлөв</Text>
      <View style={styles.card}>
        <View style={styles.statusChips}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                order.status === opt.value && styles.chipActive,
                updating && styles.chipDisabled,
              ]}
              onPress={() => handleStatusChange(opt.value)}
              disabled={updating}
            >
              <Text
                style={[
                  styles.chipText,
                  order.status === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {updating && (
          <ActivityIndicator size="small" color={THEME} style={styles.updatingSpinner} />
        )}
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

      <Text style={styles.sectionTitle}>Хаяг ба утас</Text>
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
            {addr.phone ? `\nУтас: ${addr.phone}` : ""}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 15, color: "#666" },
  backLink: { marginTop: 16 },
  backLinkText: { fontSize: 15, color: THEME, fontWeight: "600" },
  scrollContent: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  orderId: { fontSize: 18, fontWeight: "700", color: "#111" },
  date: { fontSize: 13, color: "#666" },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: "#777", marginBottom: 8, marginTop: 16, textTransform: "uppercase" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  userEmail: { fontSize: 15, fontWeight: "500", color: "#111" },
  userName: { fontSize: 13, color: "#666", marginTop: 4 },
  statusChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F0F0F0" },
  chipActive: { backgroundColor: THEME },
  chipDisabled: { opacity: 0.6 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#FFF" },
  updatingSpinner: { marginTop: 12 },
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
