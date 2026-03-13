import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";
import {
  checkOrderPayment,
  createOrderWithQPay,
  getOrder,
  type CreateOrderResponse,
  type CreateOrderWithQPayResponse,
} from "../../lib/orders-api";

const THEME_PRIMARY = "#8C1A7A";

// Bank logo: first letter(s) + color per bank name (no image assets)
const BANK_COLORS = [
  "#8C1A7A", "#1A5F7A", "#B23A48", "#2D6A4F", "#7B2CBF",
  "#C77D1E", "#3D5A80", "#BC4749", "#6A4C93", "#2A9D8F",
];
function getBankLogo(name: string): { letter: string; color: string } {
  const n = (name || "?").trim();
  const letter = n.slice(0, 1).toUpperCase();
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash << 5) - hash + n.charCodeAt(i);
  const color = BANK_COLORS[Math.abs(hash) % BANK_COLORS.length];
  return { letter, color };
}

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
  const [phone, setPhone] = useState("");
  const [paymentState, setPaymentState] = useState<CreateOrderWithQPayResponse | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const phoneTrim = phone.trim();
    if (!token || !checkoutAddress?.id || !checkoutItems?.length) {
      Alert.alert("Алдаа", "Хаяг эсвэл захиалгын мэдээлэл дутуу байна.");
      return;
    }
    if (!phoneTrim) {
      Alert.alert("Алдаа", "Хүргэлтийн утасны дугаараа оруулна уу.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrderWithQPay(token, {
        addressId: checkoutAddress.id,
        phone: phoneTrim,
        itemIds: checkoutItems.map((i) => i.product.id),
      });
      setPaymentState(result);
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      const message =
        err?.message ??
        (err?.code === "QPAY_NOT_CONFIGURED"
          ? "QPay тохиргоо хийгээгүй байна. Админтай холбогдоно уу."
          : "Захиалга үүсгэхэд алдаа гарлаа.");
      Alert.alert("Алдаа", message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkOrderPaid = useCallback(async () => {
    if (!token || !paymentState?.order.id) return;
    const order = await getOrder(token, paymentState.order.id);
    if (order && order.status !== "pending_payment") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      removeCheckoutItemsFromBasket(checkoutItems ?? []);
      setCheckoutItems(null);
      setCheckoutAddress(null);
      setOrderResult(order as CreateOrderResponse);
      setPaymentState(null);
      setShowOrderSuccess(true);
    }
  }, [token, paymentState?.order.id, checkoutItems, removeCheckoutItemsFromBasket, setCheckoutItems, setCheckoutAddress]);

  useEffect(() => {
    if (!paymentState?.order.id || !token) return;
    const id = setInterval(checkOrderPaid, 3000);
    pollingRef.current = id;
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paymentState?.order.id, token, checkOrderPaid]);

  const handleSuccessDismiss = () => {
    router.replace("/(tabs)/home");
  };

  const handleCheckPayment = useCallback(async () => {
    if (!token || !paymentState?.order.id || checkingPayment) return;
    setCheckingPayment(true);
    try {
      const result = await checkOrderPayment(token, paymentState.order.id);
      if (result.paid) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        const order = await getOrder(token, paymentState.order.id);
        if (order) {
          removeCheckoutItemsFromBasket(checkoutItems ?? []);
          setCheckoutItems(null);
          setCheckoutAddress(null);
          setOrderResult(order as CreateOrderResponse);
          setPaymentState(null);
          setShowOrderSuccess(true);
        }
      } else {
        Alert.alert("Төлбөр", "Төлбөр хараахан төлөгдөөгүй байна. Төлсний дараа дахин шалгана уу.");
      }
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Алдаа", err?.message ?? "Төлбөр шалгахад алдаа гарлаа.");
    } finally {
      setCheckingPayment(false);
    }
  }, [token, paymentState?.order.id, checkingPayment, checkoutItems, removeCheckoutItemsFromBasket, setCheckoutItems, setCheckoutAddress]);

  if (paymentState) {
    const qrUri = paymentState.qPay.qrImage
      ? (paymentState.qPay.qrImage.startsWith("data:")
          ? paymentState.qPay.qrImage
          : `data:image/png;base64,${paymentState.qPay.qrImage}`)
      : null;
    return (
      <View style={styles.container}>
        <Header title="QPay төлбөр" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.paymentScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.paymentTitle}>Захиалга #{paymentState.order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.paymentSubtitle}>
            Нийт: {formatTugrug(paymentState.order.grandTotal)} — QR уншуулж эсвэл доорх банкнаас сонгоно уу.
          </Text>
          {qrUri ? (
            <View style={styles.qrWrap}>
              <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
            </View>
          ) : null}
          <Text style={styles.bankLinksTitle}>Банк / апп руу үсрэх</Text>
          {paymentState.qPay.urls?.map((u, i) => {
            const label = u.name || u.description || "Төлөх";
            const logo = getBankLogo(label);
            return (
              <TouchableOpacity
                key={i}
                style={styles.bankLinkButton}
                onPress={() => u.link && Linking.openURL(u.link)}
              >
                <View style={[styles.bankLogo, { backgroundColor: logo.color }]}>
                  <Text style={styles.bankLogoLetter}>{logo.letter}</Text>
                </View>
                <Text style={styles.bankLinkText}>{label}</Text>
                <Ionicons name="open-outline" size={18} color={THEME_PRIMARY} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.checkPaymentButton, checkingPayment && styles.checkPaymentButtonDisabled]}
            onPress={checkingPayment ? undefined : handleCheckPayment}
            disabled={checkingPayment}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" style={styles.checkPaymentIcon} />
            <Text style={styles.checkPaymentButtonText}>
              {checkingPayment ? "Шалгаж байна..." : "Төлбөр Шалгах"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.paymentNote}>Төлбөр төлсний дараа дээрх товч дарж шалгана уу.</Text>
        </ScrollView>
      </View>
    );
  }

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
              <Text style={styles.successButtonText}>Үргэлжлүүлэх</Text>
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

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Утасны дугаар</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.phoneInput}
            placeholder="Хүргэлттэй холбохоор утасны дугаар"
            placeholderTextColor="#B0B0B0"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Төлбөрийн тойм</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>НӨАТ-гүй дүн</Text>
            <Text style={styles.summaryValue}>{formatTugrug(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>НӨАТ (10%)</Text>
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
  paymentScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  qrWrap: {
    alignSelf: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 24,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  bankLinksTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 12,
  },
  bankLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 8,
  },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bankLogoLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bankLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111111",
  },
  checkPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: THEME_PRIMARY,
  },
  checkPaymentButtonDisabled: {
    opacity: 0.7,
  },
  checkPaymentIcon: {
    marginRight: 8,
  },
  checkPaymentButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  paymentNote: {
    fontSize: 13,
    color: "#888888",
    marginTop: 20,
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
  phoneInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#FAFAFA",
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
