import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Header } from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";
import { createOrder, type CreateOrderResponse } from "../../lib/orders-api";

const THEME_PRIMARY = "#8C1A7A";

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/home");
  }
}

export default function CheckoutConfirmScreen() {
  const { token } = useAuth();
  const {
    checkoutItems,
    checkoutAddress,
    setCheckoutItems,
    setCheckoutAddress,
    removeCheckoutItemsFromBasket,
    userVerified,
  } = useGrocery();
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { subtotal, tax, delivery, grandTotal, lines } = useMemo(() => {
    if (!checkoutItems || checkoutItems.length === 0) {
      return { subtotal: 0, tax: 0, delivery: 0, grandTotal: 0, lines: [] };
    }
    const sub = checkoutItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const t = sub * 0.1;
    const del = sub > 30 ? 0 : sub === 0 ? 0 : 4.99;
    return {
      subtotal: sub,
      tax: t,
      delivery: del,
      grandTotal: sub + t + del,
      lines: checkoutItems.map(
        (item) =>
          `${item.quantity} × ${item.product.name} — ${formatTugrug(item.product.price * item.quantity)}`
      ),
    };
  }, [checkoutItems]);

  const addressLines = useMemo(() => {
    if (!checkoutAddress) return [];
    return [
      checkoutAddress.fullName,
      checkoutAddress.line1,
      checkoutAddress.line2,
      `${checkoutAddress.city}${checkoutAddress.postalCode ? " " + checkoutAddress.postalCode : ""}`.trim(),
      checkoutAddress.instructions,
    ].filter(Boolean);
  }, [checkoutAddress]);

  const handleConfirm = async () => {
    if (!userVerified) {
      router.replace("/(tabs)/profile");
      return;
    }
    if (!token || !checkoutAddress?.id || !checkoutItems?.length) {
      Alert.alert("Алдаа", "Хаяг эсвэл захиалгын мэдээлэл дутуу байна.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder(token, {
        addressId: checkoutAddress.id,
        itemIds: checkoutItems.map((i) => i.product.id),
      });
      removeCheckoutItemsFromBasket(checkoutItems);
      setCheckoutItems(null);
      setCheckoutAddress(null);
      setOrderResult(order);
      setShowOrderSuccess(true);
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Захиалга үүсгэхэд алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDismiss = () => {
    router.replace("/(tabs)/home");
  };

  if (showOrderSuccess) {
    const order = orderResult;
    const createdDate = order?.createdAt
      ? new Date(order.createdAt).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })
      : "";
    return (
      <View style={styles.container}>
        <Header title="Захиалга баталгаажлаа" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.successScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCenter}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Захиалга амжилттай!</Text>
            <Text style={styles.successSubtitle}>
              Таны захиалгыг өгсөн хаяг руу илгээж байна.
            </Text>
            {order && (
              <View style={styles.posCard}>
                <Text style={styles.posTitle}>Захиалгын дэлгэрэнгүй</Text>
                <View style={styles.posRow}>
                  <Text style={styles.posLabel}>Захиалгын дугаар</Text>
                  <Text style={styles.posValue}>#{order.id.slice(-8).toUpperCase()}</Text>
                </View>
                <View style={styles.posRow}>
                  <Text style={styles.posLabel}>Огноо</Text>
                  <Text style={styles.posValue}>{createdDate}</Text>
                </View>
                <View style={styles.posDivider} />
                {order.lines?.map((line, i) => (
                  <View key={i} style={styles.posLineRow}>
                    <Text style={styles.posLineText} numberOfLines={1}>
                      {line.quantity} × {line.productName}
                    </Text>
                    <Text style={styles.posLineTotal}>{formatTugrug(Number(line.total))}</Text>
                  </View>
                ))}
                <View style={styles.posDivider} />
                <View style={styles.posRow}>
                  <Text style={styles.posTotalLabel}>Нийт дүн</Text>
                  <Text style={styles.posTotalValue}>{formatTugrug(order.grandTotal)}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessDismiss}>
              <Text style={styles.successButtonText}>Сайн байна</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!checkoutItems?.length || !checkoutAddress) {
    return (
      <View style={styles.container}>
        <Header
          title="Захиалга баталгаажуулах"
          leftElement={
            <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#111111" />
            </TouchableOpacity>
          }
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>Захиалга эсвэл хаяг олдсонгүй. Буцаад дахин оролдоно уу.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Захиалга баталгаажуулах"
        leftElement={
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#111111" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Захиалгын тойм</Text>
        <View style={styles.card}>
          {lines.map((line, i) => (
            <Text key={i} style={styles.lineText}>
              {line}
            </Text>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Хүргэлтийн хаяг</Text>
        <View style={styles.card}>
          {addressLines.map((line, i) => (
            <Text key={i} style={styles.addressLine}>
              {line}
            </Text>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Төлбөрийн тойм</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Дэд дүн</Text>
            <Text style={styles.summaryValue}>{formatTugrug(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Татвар (10%)</Text>
            <Text style={styles.summaryValue}>{formatTugrug(tax)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Хүргэлт</Text>
            <Text style={styles.summaryValue}>
              {delivery === 0 ? "Үнэгүй" : formatTugrug(delivery)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Нийт</Text>
            <Text style={styles.summaryTotalValue}>{formatTugrug(grandTotal)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={submitting ? undefined : handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting ? "Түр хүлээнэ үү..." : "Захиалга баталгаажуулах"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  successScrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  successCenter: {
    alignItems: "center",
  },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  posCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  posTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  posRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  posLabel: { fontSize: 13, color: "#666666" },
  posValue: { fontSize: 13, color: "#111111", fontWeight: "500" },
  posDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 10,
  },
  posLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  posLineText: { fontSize: 14, color: "#333333", flex: 1, marginRight: 8 },
  posLineTotal: { fontSize: 14, color: "#111111", fontWeight: "500" },
  posTotalLabel: { fontSize: 15, fontWeight: "600", color: "#111111" },
  posTotalValue: { fontSize: 18, fontWeight: "700", color: THEME_PRIMARY },
  successButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: THEME_PRIMARY,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 10,
  },
  sectionSpacing: { marginTop: 20 },
  card: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  lineText: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  summaryLabel: { fontSize: 14, color: "#666666" },
  summaryValue: { fontSize: 14, color: "#111111" },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E4",
  },
  confirmButton: {
    borderRadius: 12,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
