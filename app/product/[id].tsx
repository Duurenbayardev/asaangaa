import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CAROUSEL_ITEM_WIDTH = Dimensions.get("window").width - 40;
import { AddedToBasketToast } from "../../components/AddedToBasketToast";
import { Header } from "../../components/Header";
import { VerificationBanner } from "../../components/VerificationBanner";
import { getCategoryLabel } from "../../constants/categories";
import { getUnitDisplayLabel } from "../../constants/units";
import { formatTugrug } from "../../lib/formatCurrency";
import { resolveImageUrl } from "../../lib/api-client";
import { useGrocery } from "../../context/GroceryContext";

const THEME_PRIMARY = "#8C1A7A";

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/home");
  }
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, basket, wishlist, addToBasket, updateQuantity, toggleWishlist, setCheckoutItems, userVerified } = useGrocery();

  const product = useMemo(
    () => products.find((p) => p.id === id),
    [products, id]
  );

  const basketItem = product ? basket[product.id] : undefined;
  const quantity = basketItem?.quantity ?? 0;
  const lineTotal = product ? product.price * quantity : 0;
  const isInWishlist = product ? wishlist.has(product.id) : false;
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const dismissToast = useCallback(() => setShowAddedToast(false), []);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const onHeroImageLoad = useCallback((index: number) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  }, []);
  const onHeroImageError = useCallback((index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }));
  }, []);

  const productsLoading = products.length === 0;
  if (!product && !productsLoading) {
    return (
      <View style={styles.container}>
        <Header
          leftElement={
            <Pressable onPress={goBack} style={styles.backButton} hitSlop={16}>
              <Ionicons name="chevron-back" size={22} color="#111111" />
            </Pressable>
          }
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Энэ бүтээгдэхүүн олдсонгүй. Нүүр эсвэл Ангилалаас дахин оролдоно уу.
          </Text>
        </View>
      </View>
    );
  }

  if (!product && productsLoading) {
    return (
      <View style={styles.container}>
        <Header
          leftElement={
            <Pressable onPress={goBack} style={styles.backButton} hitSlop={16}>
              <Ionicons name="chevron-back" size={22} color="#111111" />
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroImageWrap, styles.imagePlaceholder]}>
            <ActivityIndicator size="large" color={THEME_PRIMARY} />
          </View>
          <View style={styles.hero}>
            <View style={styles.namePlaceholder} />
            <View style={styles.pricePlaceholder} />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Энэ бүтээгдэхүүний тухай</Text>
            <View style={styles.bodyPlaceholder}>
              <ActivityIndicator size="small" color={THEME_PRIMARY} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const handleIncrement = () => {
    if (quantity === 0) {
      addToBasket(product);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (quantity === 0) addToBasket(product);
    setShowAddedToast(true);
  };

  const handleCheckout = () => {
    if (!userVerified) {
      setShowVerificationBanner(true);
      return;
    }
    const qty = quantity === 0 ? 1 : quantity;
    if (quantity === 0) addToBasket(product);
    setCheckoutItems([{ product, quantity: qty }]);
    router.push("/checkout/address");
  };

  return (
    <View style={styles.container}>
      <Header
        title={product.name}
        leftElement={
          <Pressable onPress={goBack} style={styles.backButton} hitSlop={16}>
            <Ionicons name="chevron-back" size={22} color="#111111" />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
          contentContainerStyle={styles.imageCarouselContent}
        >
          {product.images.length === 0 ? (
            <View style={[styles.heroImageWrap, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color="#CCC" />
            </View>
          ) : (
            product.images.map((src, index) => {
              const uri = resolveImageUrl(src) ?? (src.startsWith("http") ? src : undefined);
              const loaded = imageLoaded[index];
              const failed = imageError[index];
              return (
                <View key={index} style={styles.heroImageWrap}>
                  {uri && !failed ? (
                    <Image
                      source={{ uri }}
                      style={styles.heroImage}
                      resizeMode="cover"
                      onLoad={() => onHeroImageLoad(index)}
                      onError={() => onHeroImageError(index)}
                    />
                  ) : null}
                  {(!loaded && uri && !failed) || failed ? (
                    <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
                      {failed ? (
                        <Ionicons name="image-outline" size={48} color="#CCC" />
                      ) : (
                        <ActivityIndicator size="large" color={THEME_PRIMARY} />
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{getCategoryLabel(product.category)}</Text>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{getUnitDisplayLabel(product.unit)}</Text>
          <Text style={styles.price}>{formatTugrug(product.price)}</Text>

          <View style={styles.quantityWishlistRow}>
            <View>
              <Text style={styles.quantityLabel}>{getUnitDisplayLabel(product.unit)}</Text>
              <View style={styles.counterRow}>
                <Pressable
                  style={[styles.counterButton, styles.counterButtonLeft]}
                  onPress={handleDecrement}
                >
                  <Text style={styles.counterSymbol}>-</Text>
                </Pressable>
                <Text style={styles.counterValue}>{quantity}</Text>
                <Pressable
                  style={[styles.counterButton, styles.counterButtonRight]}
                  onPress={handleIncrement}
                >
                  <Text style={styles.counterSymbol}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={() => toggleWishlist(product)}
              style={styles.wishlistChip}
            >
              <Ionicons
                name={isInWishlist ? "heart" : "heart-outline"}
                size={24}
                color={isInWishlist ? THEME_PRIMARY : "#555555"}
              />
              <Text style={styles.wishlistChipText}>
                {isInWishlist ? "Хадгалсан" : "Хадгалах"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.helper}>
            Сагснаас тоо ширхэгээ өөрчилж болно.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Энэ бүтээгдэхүүний тухай</Text>
          <Text style={styles.body}>
            {product.description?.trim() || "Тайлбар оруулаагүй байна."}
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Нийт дүн</Text>
          <Text style={styles.totalValue}>
            {quantity > 0
              ? formatTugrug(lineTotal)
              : "Дор хаяж 1 ширхэг нэмнэ үү"}
          </Text>
        </View>
        <View style={styles.checkoutButtons}>
          <Pressable
            style={[
              styles.secondaryButton,
              quantity === 0 && styles.secondaryButtonDisabled,
            ]}
            onPress={quantity === 0 ? undefined : handleAddToCart}
          >
            <Text style={styles.secondaryButtonText}>Сагсанд нэмэх</Text>
          </Pressable>
          <Pressable
            style={[
              styles.primaryButton,
              quantity === 0 && styles.primaryButtonDisabled,
            ]}
            onPress={quantity === 0 ? undefined : handleCheckout}
          >
            <Text style={styles.primaryButtonText}>Төлбөр төлөх</Text>
          </Pressable>
        </View>
      </View>

      <AddedToBasketToast
        visible={showAddedToast}
        onDismiss={dismissToast}
      />
      {showVerificationBanner && (
        <View style={styles.verificationBannerWrap}>
          <VerificationBanner
            visible
            onGoToProfile={() => {
              setShowVerificationBanner(false);
              router.replace("/(tabs)/profile");
            }}
            onDismiss={() => setShowVerificationBanner(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  backButton: {
    padding: 12,
    marginLeft: -4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  imageCarousel: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageCarouselContent: {
    alignItems: "stretch",
  },
  heroImageWrap: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 280,
    backgroundColor: "#F3F3F3",
  },
  heroImage: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 280,
    backgroundColor: "#F3F3F3",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  namePlaceholder: {
    height: 24,
    width: "80%",
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    marginTop: 12,
  },
  pricePlaceholder: {
    height: 20,
    width: 120,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    marginTop: 12,
  },
  bodyPlaceholder: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  quantityWishlistRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 18,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 6,
  },
  wishlistChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    backgroundColor: "#FAFAFA",
  },
  wishlistChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FBE6F8",
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME_PRIMARY,
  },
  name: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  unit: {
    marginTop: 4,
    fontSize: 14,
    color: "#777777",
  },
  price: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  counterButtonLeft: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  counterButtonRight: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  counterSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  counterValue: {
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#999999",
  },
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E4E4E4",
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: "#777777",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  checkoutButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333333",
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: THEME_PRIMARY,
  },
  primaryButtonDisabled: {
    backgroundColor: "#D2B5CC",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verificationBannerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    zIndex: 50,
  },
});

