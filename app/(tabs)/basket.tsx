import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../../components/Header";
import { VerificationBanner } from "../../components/VerificationBanner";
import { useGrocery } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";

const THEME_PRIMARY = "#8C1A7A";

export default function BasketScreen() {
  const { basket, setCheckoutItems, updateQuantity, userVerified } = useGrocery();
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  const items = useMemo(() => Object.values(basket), [basket]);
  const hasItems = items.length > 0;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const delivery = subtotal > 30 ? 0 : subtotal === 0 ? 0 : 4.99;
  const grandTotal = subtotal + tax + delivery;

  const handleCheckout = () => {
    if (!userVerified) {
      setShowVerificationBanner(true);
      return;
    }
    setCheckoutItems(items);
    router.push("/checkout/address");
  };

  if (!hasItems) {
    return (
      <View style={styles.container}>
        <Header title="Миний сагс" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Сагс хоосон байна. Нүүр эсвэл Ангилалаас бүтээгдэхүүн нэмнэ үү.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Миний сагс" />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <View key={item.product.id} style={styles.basketItemCard}>
            <View style={styles.basketItemTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.basketItemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.basketItemMeta}>
                  {item.product.unit} · {formatTugrug(item.product.price)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  Alert.alert(
                    "Та энэ барааг сагснаасаа хасах гэж байна.",
                    `${item.product.name}`,
                    [
                      { text: "Цуцлах ", style: "cancel" },
                      {
                        text: "Хасах",
                        style: "destructive",
                        onPress: () => updateQuantity(item.product.id, 0),
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.removeButtonText}>Хасах</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.basketItemBottomRow}>
              <Text style={styles.lineTotal}>
                {formatTugrug(item.product.price * item.quantity)}
              </Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyButton, styles.qtyButtonPrimary]}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Text style={[styles.qtyButtonText, styles.qtyButtonTextPrimary]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <VerificationBanner
        visible={showVerificationBanner}
        onGoToProfile={() => {
          setShowVerificationBanner(false);
          router.push("/(tabs)/profile");
        }}
        onDismiss={() => setShowVerificationBanner(false)}
      />
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerTotalLabel}>Нийт</Text>
          <Text style={styles.footerTotalValue}>{formatTugrug(grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Төлбөр төлөх</Text>
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
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  basketItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginBottom: 12,
  },
  basketItemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  basketItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  basketItemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B42318",
  },
  basketItemBottomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9E9E9",
    borderRadius: 999,
    overflow: "hidden",
  },
  qtyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  qtyButtonPrimary: {
    backgroundColor: "#F6EAF3",
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#444444",
    minWidth: 14,
    textAlign: "center",
  },
  qtyButtonTextPrimary: {
    color: THEME_PRIMARY,
  },
  qtyValue: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    minWidth: 24,
    textAlign: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: "#777777",
    textAlign: "center",
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E4",
    gap: 12,
  },
  footerTotalLabel: {
    fontSize: 13,
    color: "#777777",
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  checkoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: THEME_PRIMARY,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  checkoutPanel: {
    display: "none",
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 6,
  },
  helper: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 8,
  },
  addressInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#FAFAFA",
  },
  addressSpacing: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  halfInput: {
    flex: 1,
    minHeight: 48,
  },
  checkoutRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 13,
    color: "#777777",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  confirmButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: THEME_PRIMARY,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    overflow: "hidden",
  },
  confirmButtonDisabled: {
    backgroundColor: "#D2B5CC",
  },
  sheetBackdrop: {
    display: "none",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  savedList: {
    marginTop: 8,
    gap: 8,
  },
  savedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  savedCardActive: {
    borderColor: THEME_PRIMARY,
    backgroundColor: "#FFF6FE",
  },
  savedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  savedName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  savedBody: {
    fontSize: 13,
    color: "#555555",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8C8C8",
  },
  radioActive: {
    borderColor: THEME_PRIMARY,
    backgroundColor: THEME_PRIMARY,
  },
  addNewButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME_PRIMARY,
  },
  form: {
    marginTop: 8,
  },
  sheetButtons: {
    display: "none",
  },
  sheetSecondary: {
    fontSize: 14,
    color: "#777777",
  },
  sheetPrimary: {
    display: "none",
  },
  paymentCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 24,
  },
  summary: {
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#777777",
  },
  summaryValue: {
    fontSize: 13,
    color: "#333333",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
});

