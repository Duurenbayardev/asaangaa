import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BackButton } from "../../components/BackButton";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";
import {
    checkOrderPayment,
    createOrder,
    createOrderWithQPay,
    getOrder,
    type CreateOrderResponse,
    type CreateOrderWithQPayResponse,
} from "../../lib/orders-api";

const THEME_PRIMARY = "#8C1A7A";

// Logo.dev: bank name → domain for logo lookup (only publishable key in app; secret key is server-side only)
function getLogoDevPublishableKey(): string {
  try {
    const fromProcess =
      typeof process !== "undefined" && (process as unknown as { env?: Record<string, string> }).env?.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;
    if (typeof fromProcess === "string" && fromProcess) return fromProcess;
    const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra) as Record<string, unknown> | undefined;
    const fromExtra = extra?.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;
    if (typeof fromExtra === "string" && fromExtra) return fromExtra;
  } catch (_) {}
  return "";
}

// Bank name (various labels) → domain for Logo.dev
const BANK_DOMAINS: Record<string, string> = {
  "khan bank": "khanbank.com",
  khanbank: "khanbank.com",
  "state bank": "statebank.mn",
  statebank: "statebank.mn",
  "төрийн банк": "statebank.mn",
  "xac bank": "xacbank.mn",
  xacbank: "xacbank.mn",
  "хас банк": "xacbank.mn",
  "trade and development bank": "tdbm.mn",
  tdb: "tdbm.mn",
  tdbbank: "tdbm.mn",
  "most money": "most.mn",
  most: "most.mn",
  "мост мони": "most.mn",
  "national investment bank": "nibank.mn",
  nibank: "nibank.mn",
  "chinggis khaan bank": "ckb.mn",
  chinggis: "ckb.mn",
  "чингис хаан банк": "ckb.mn",
  "capitron bank": "capitron.mn",
  capitron: "capitron.mn",
  "bogd bank": "bogdbank.mn",
  bogdbank: "bogdbank.mn",
  "богд банк": "bogdbank.mn",
  "candy pay": "monpay.mn",
  "мон пэй": "monpay.mn",
  monpay: "monpay.mn",
};

function getBankDomain(name: string): string | null {
  const key = (name || "").toLowerCase().trim();
  if (BANK_DOMAINS[key]) return BANK_DOMAINS[key];
  const match = Object.keys(BANK_DOMAINS).find((k) => key.includes(k) || k.includes(key));
  return match ? BANK_DOMAINS[match] : null;
}

// Domain → Mongolian display name for bank/app labels
const BANK_MONGOLIAN_NAMES: Record<string, string> = {
  "khanbank.com": "Хан банк",
  "statebank.mn": "Төрийн банк",
  "xacbank.mn": "Хас банк",
  "tdbm.mn": "Хөгжлийн банк",
  "most.mn": "Мост Мони",
  "nibank.mn": "Хөрөнгө оруулалтын банк",
  "ckb.mn": "Чингис Хаан банк",
  "capitron.mn": "Капитрон банк",
  "bogdbank.mn": "Богд банк",
  "monpay.mn": "Мон Пэй",
};

function getBankMongolianName(apiLabel: string): string {
  const domain = getBankDomain(apiLabel);
  if (domain && BANK_MONGOLIAN_NAMES[domain]) return BANK_MONGOLIAN_NAMES[domain];
  return apiLabel;
}

// Curated bank badges: fallback initials + color when Logo.dev has no logo
const BANK_BADGES: Record<string, { abbr: string; color: string }> = {
  "khan bank": { abbr: "KH", color: "#0D47A1" },
  "khanbank": { abbr: "KH", color: "#0D47A1" },
  "state bank": { abbr: "SB", color: "#1B5E20" },
  "statebank": { abbr: "SB", color: "#1B5E20" },
  "төрийн банк": { abbr: "SB", color: "#1B5E20" },
  "xac bank": { abbr: "XB", color: "#B71C1C" },
  "xacbank": { abbr: "XB", color: "#B71C1C" },
  "хас банк": { abbr: "XB", color: "#B71C1C" },
  "trade and development bank": { abbr: "TDB", color: "#004D40" },
  "tdb": { abbr: "TDB", color: "#004D40" },
  "tdbbank": { abbr: "TDB", color: "#004D40" },
  "most money": { abbr: "MO", color: "#E65100" },
  "most": { abbr: "MO", color: "#E65100" },
  "мост мони": { abbr: "MO", color: "#E65100" },
  "national investment bank": { abbr: "NI", color: "#4A148C" },
  "nibank": { abbr: "NI", color: "#4A148C" },
  "chinggis khaan bank": { abbr: "CK", color: "#BF360C" },
  "chinggis": { abbr: "CK", color: "#BF360C" },
  "чингис хаан банк": { abbr: "CK", color: "#BF360C" },
  "capitron bank": { abbr: "CP", color: "#00695C" },
  "capitron": { abbr: "CP", color: "#00695C" },
  "bogd bank": { abbr: "BG", color: "#37474F" },
  "bogdbank": { abbr: "BG", color: "#37474F" },
  "богд банк": { abbr: "BG", color: "#37474F" },
  "candy pay": { abbr: "MP", color: "#C2185B" },
  "мон пэй": { abbr: "MP", color: "#C2185B" },
};

const FALLBACK_COLORS = ["#5E35B1", "#0277BD", "#00838F", "#2E7D32", "#F9A825", "#D84315", "#6A1B9A", "#00695C"];

function getBankBadge(name: string): { abbr: string; color: string } {
  const key = (name || "").toLowerCase().trim();
  const exact = BANK_BADGES[key];
  if (exact) return exact;
  const match = Object.keys(BANK_BADGES).find((k) => key.includes(k) || k.includes(key));
  if (match) return BANK_BADGES[match];
  const abbr = key.length >= 2 ? key.slice(0, 2).toUpperCase() : (key[0] ?? "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
  const color = FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
  return { abbr, color };
}

const LOGO_DEV_SIZE = 112;
const LOGO_DEV_BASE = "https://img.logo.dev";

function BankBadge({ name }: { name: string }) {
  const [logoError, setLogoError] = useState(false);
  const domain = getBankDomain(name);
  const token = getLogoDevPublishableKey();
  const showLogo = Boolean(domain && token && !logoError);
  const { abbr, color } = getBankBadge(name);

  useEffect(() => {
    setLogoError(false);
  }, [name]);

  if (showLogo && domain && token) {
    const logoUri = `${LOGO_DEV_BASE}/${domain}?token=${encodeURIComponent(token)}&size=${LOGO_DEV_SIZE}&format=png&fallback=404`;
    return (
      <View style={[styles.bankBadge, styles.bankBadgeLogoWrap]}>
        <Image
          source={{ uri: logoUri }}
          style={styles.bankBadgeLogo}
          onError={() => setLogoError(true)}
        />
      </View>
    );
  }
  return (
    <View style={[styles.bankBadge, { backgroundColor: color }]}>
      <Text style={styles.bankBadgeText}>{abbr}</Text>
    </View>
  );
}

export default function CheckoutConfirmScreen() {
  const { token, user, isRestored } = useAuth();
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
  const [useVerifiedPhone, setUseVerifiedPhone] = useState(!!user?.phone);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [paymentState, setPaymentState] = useState<CreateOrderWithQPayResponse | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifiedPhone = user?.phone?.trim() ?? "";
  const hasPhone = useVerifiedPhone ? !!verifiedPhone : phone.trim().length >= 1;

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
    const phoneTrim = useVerifiedPhone && verifiedPhone ? verifiedPhone : phone.trim();
    if (!token || !checkoutAddress?.id || !checkoutItems?.length) {
      Alert.alert("Алдаа", "Хаяг эсвэл захиалгын мэдээлэл дутуу байна.");
      return;
    }
    if (!phoneTrim) {
      Alert.alert("Алдаа", "Хүргэлтийн утасны дугаараа оруулна уу эсвэл баталгаажсан дугаараа ашиглана уу.");
      return;
    }
    setSubmitting(true);
    try {
      // Admin can create an order without payment (skip QPay).
      if (user?.role === "admin") {
        const result = await createOrder(token, {
          addressId: checkoutAddress.id,
          phone: phoneTrim,
          itemIds: checkoutItems.map((i) => i.product.id),
        });
        removeCheckoutItemsFromBasket(checkoutItems ?? []);
        setCheckoutItems(null);
        setCheckoutAddress(null);
        setOrderResult(result);
        setPaymentState(null);
        setShowOrderSuccess(true);
      } else {
        const result = await createOrderWithQPay(token, {
          addressId: checkoutAddress.id,
          phone: phoneTrim,
          itemIds: checkoutItems.map((i) => i.product.id),
        });
        setPaymentState(result);
      }
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

  useEffect(() => {
    if (isRestored && !token) {
      router.replace("/login");
    }
  }, [isRestored, token]);

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
        <BackButton />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.paymentScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.paymentOrderCard}>
            <Text style={styles.paymentOrderLabel}>Захиалга</Text>
            <Text style={styles.paymentOrderId}>#{paymentState.order.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.paymentOrderTotal}>{formatTugrug(paymentState.order.grandTotal)}</Text>
          </View>

          {qrUri ? (
            <View style={styles.qrCard}>
              <Text style={styles.qrLabel}>QR уншуулна уу</Text>
              <View style={styles.qrInner}>
                <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
              </View>
              <TouchableOpacity
                style={[styles.checkPaymentButton, checkingPayment && styles.checkPaymentButtonDisabled]}
                onPress={checkingPayment ? undefined : handleCheckPayment}
                disabled={checkingPayment}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" style={styles.checkPaymentIcon} />
                <Text style={styles.checkPaymentButtonText}>
                  {checkingPayment ? "Шалгаж байна..." : "Төлбөр Шалгах"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkPaymentButton, styles.checkPaymentButtonStandalone, checkingPayment && styles.checkPaymentButtonDisabled]}
              onPress={checkingPayment ? undefined : handleCheckPayment}
              disabled={checkingPayment}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" style={styles.checkPaymentIcon} />
              <Text style={styles.checkPaymentButtonText}>
                {checkingPayment ? "Шалгаж байна..." : "Төлбөр Шалгах"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.banksCard}>
            <Text style={styles.banksCardTitle}>Банк / апп сонгох</Text>
            <View style={styles.bankGrid}>
              {paymentState.qPay.urls?.map((u, i) => {
                const label = u.name || u.description || "Төлөх";
                const displayName = getBankMongolianName(label);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.bankGridItem}
                    onPress={() => u.link && Linking.openURL(u.link)}
                    activeOpacity={0.7}
                  >
                    <BankBadge name={label} />
                    <Text style={styles.bankGridLabel} numberOfLines={2}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.paymentNote}>Төлбөр төлсний дараа «Төлбөр Шалгах» товч дарж баталгаажуулна уу.</Text>
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
        <BackButton />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.successScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCenter}>
            <View style={styles.successHero}>
              <View style={styles.successHeroBlob1} />
              <View style={styles.successHeroBlob2} />
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={34} color="#FFFFFF" />
              </View>
              <Text style={styles.successKicker}>Амжилттай</Text>
              <Text style={styles.successTitle}>Захиалга баталгаажлаа!</Text>
              <Text style={styles.successSubtitle}>
                Бид таны захиалгыг бэлтгээд, хүргэлтээр илгээнэ.
              </Text>
            </View>
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
        <BackButton />
        <View style={styles.center}>
          <Text style={styles.errorText}>Захиалга эсвэл хаяг олдсонгүй. Буцаад дахин оролдоно уу.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
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
          {verifiedPhone ? (
            <>
              {useVerifiedPhone ? (
                <View style={styles.phoneRow}>
                  <Text style={styles.phoneVerifiedLabel}>Баталгаажсан дугаар ашиглах</Text>
                  <Text style={styles.phoneVerifiedValue}>{verifiedPhone}</Text>
                  <Pressable
                    style={styles.phoneSwitchLink}
                    onPress={() => setUseVerifiedPhone(false)}
                  >
                    <Text style={styles.phoneSwitchLinkText}>Өөр дугаар оруулах</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Pressable
                    style={styles.phoneUseVerifiedWrap}
                    onPress={() => setUseVerifiedPhone(true)}
                  >
                    <Text style={styles.phoneUseVerifiedText}>
                      Баталгаажсан дугаар ашиглах ({verifiedPhone})
                    </Text>
                  </Pressable>
                  <TextInput
                    style={[styles.phoneInput, styles.phoneInputTop]}
                    placeholder="Эсвэл өөр утасны дугаар оруулах"
                    placeholderTextColor="#B0B0B0"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            </>
          ) : (
            <TextInput
              style={styles.phoneInput}
              placeholder="Хүргэлттэй холбохоор утасны дугаар"
              placeholderTextColor="#B0B0B0"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          )}
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
          style={[
            styles.confirmButton,
            (submitting || !hasPhone) && styles.confirmButtonDisabled,
          ]}
          onPress={submitting || !hasPhone ? undefined : handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting
              ? "Түр хүлээнэ үү..."
              : (user?.role === "admin" ? "Төлбөргүй баталгаажуулах" : "Захиалга баталгаажуулах")}
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
  successScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },
  successCenter: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
  },
  successHero: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EFEFF0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  successHeroBlob1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(140,26,122,0.12)",
    top: -70,
    right: -60,
  },
  successHeroBlob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(46,125,50,0.12)",
    bottom: -70,
    left: -60,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  successKicker: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  posCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EFEFF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
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
    paddingTop: 72,
    paddingBottom: 48,
  },
  paymentOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOrderLabel: {
    fontSize: 12,
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  paymentOrderId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  paymentOrderTotal: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME_PRIMARY,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 16,
  },
  qrInner: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  banksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  banksCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "stretch",
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  bankGridItem: {
    flexBasis: "25%",
    width: "25%",
    maxWidth: "25%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  bankGridLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#555555",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  bankBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  bankBadgeLogoWrap: {
    backgroundColor: "#FFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 6,
  },
  bankBadgeLogo: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  bankBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  checkPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: THEME_PRIMARY,
    shadowColor: THEME_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkPaymentButtonDisabled: {
    opacity: 0.8,
  },
  checkPaymentButtonStandalone: {
    marginBottom: 16,
  },
  checkPaymentIcon: {
    marginRight: 10,
  },
  checkPaymentButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paymentNote: {
    fontSize: 12,
    color: "#999999",
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  scroll: { flex: 1,
    height: "100%",
   },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
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
  phoneInputTop: {
    marginTop: 10,
  },
  phoneRow: {
    gap: 4,
  },
  phoneVerifiedLabel: {
    fontSize: 13,
    color: "#666666",
  },
  phoneVerifiedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  phoneSwitchLink: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  phoneSwitchLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_PRIMARY,
  },
  phoneUseVerifiedWrap: {
    paddingVertical: 6,
  },
  phoneUseVerifiedText: {
    fontSize: 14,
    color: THEME_PRIMARY,
    fontWeight: "500",
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
