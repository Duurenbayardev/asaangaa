import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { VerificationBanner } from "../../components/VerificationBanner";
import { useGrocery } from "../../context/GroceryContext";
import type { BasketItem } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";
import { useResolvedImageUri } from "../../lib/imageSource";

const THEME_PRIMARY = "#8C1A7A";
const CARD_PADDING = 16;
const THUMB_SIZE = 88;

function BasketRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: BasketItem;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}) {
  const uri = useResolvedImageUri(item.product.images?.[0]) ?? undefined;
  const lineTotal = item.product.price * item.quantity;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={32} color="#CCC" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.itemMeta}>
            {item.product.unit} · {formatTugrug(item.product.price)} / нэгж
          </Text>
          <View style={styles.qtyRow}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onUpdateQty(item.product.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={18} color="#333" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onUpdateQty(item.product.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={18} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>{formatTugrug(lineTotal)}</Text>
          </View>
        </View>
      </View>
      <Pressable
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert(
            "Сагснаас хасах",
            `${item.product.name} - энэ барааг хасах уу?`,
            [
              { text: "Үгүй", style: "cancel" },
              { text: "Хасах", style: "destructive", onPress: () => onRemove(item.product.id) },
            ]
          )
        }
      >
        <Ionicons name="trash-outline" size={20} color="#B42318" />
      </Pressable>
    </View>
  );
}

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
        <AppHeader />
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={64} color="#C0C0C0" />
          <Text style={styles.emptyTitle}>Сагс хоосон</Text>
          <Text style={styles.emptyText}>
            Нүүр эсвэл Ангилалаас бүтээгдэхүүн нэмж, төлбөр төлөхөд бэлтгэнэ үү.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <BasketRow
            key={item.product.id}
            item={item}
            onUpdateQty={updateQuantity}
            onRemove={(id) => updateQuantity(id, 0)}
          />
        ))}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Дэд дүн</Text>
            <Text style={styles.summaryValue}>{formatTugrug(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>НӨАТ (10%)</Text>
            <Text style={styles.summaryValue}>{formatTugrug(tax)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Хүргэлт</Text>
            <Text style={styles.summaryValue}>{formatTugrug(delivery)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Нийт дүн</Text>
            <Text style={styles.summaryTotalValue}>{formatTugrug(grandTotal)}</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: CARD_PADDING,
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#777777",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  stepperValue: {
    minWidth: 36,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  deleteBtn: {
    padding: 8,
    marginTop: -4,
    marginRight: -4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 13,
    color: "#333333",
  },
  summaryTotalRow: {
    marginTop: 8,
    marginBottom: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME_PRIMARY,
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
});

