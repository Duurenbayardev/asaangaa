import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { LoadingScreen } from "../../components/LoadingScreen";
import { ProductCard } from "../../components/ProductCard";
import { getCategoriesOrdered } from "../../constants/categories";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";

const BANNER_COUNT = 2;

const SCREEN_PADDING = 20;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CATEGORY_CARD_WIDTH = 100;
const CATEGORY_CARD_GAP = 10;
const PRODUCT_GAP = 12;
const PRODUCT_SIZE = (SCREEN_WIDTH - SCREEN_PADDING * 2 - PRODUCT_GAP) / 2;

const CATEGORIES = getCategoriesOrdered();

export default function HomeScreen() {
  const { user } = useAuth();
  const { products, basket } = useGrocery();
  const displayName = user?.name?.trim() || user?.phone || "хэрэглэгч";
  const [bannersLoaded, setBannersLoaded] = useState(0);
  const [showLoading, setShowLoading] = useState(true);

  const loadingProgress = bannersLoaded === 0 ? 0 : (bannersLoaded / BANNER_COUNT) * 100;

  const onBannerLoad = useCallback(() => {
    setBannersLoaded((n) => {
      const next = n + 1;
      if (next >= BANNER_COUNT) {
        setTimeout(() => setShowLoading(false), 300);
        return BANNER_COUNT;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setShowLoading(false);
    }, 5000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader />
      {showLoading && <LoadingScreen progress={loadingProgress} />}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Өглөөний мэнд, {displayName}</Text>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerSlider}
        >
          <ImageBackground
            source={require("../../assets/images/banner1.jpg")}
            style={styles.bannerImage}
            onLoad={onBannerLoad}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Өглөөний зах утасанд</Text>
              <Text style={styles.bannerSubtitle}>
                Шинэ бүтээгдэхүүн, өдөр бүрийн хэрэгцээ, өдөр бүр шинэчлэгдэнэ.
              </Text>
            </View>
          </ImageBackground>
          <ImageBackground
            source={require("../../assets/images/banner2.jpg")}
            style={styles.bannerImage}
            onLoad={onBannerLoad}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Сагсаа тайван дүүргэ</Text>
              <Text style={styles.bannerSubtitle}>
                Хэдхэн секундэд нэмж, нийт дүнгээ үргэлж харна.
              </Text>
            </View>
          </ImageBackground>
        </ScrollView>

        <View style={styles.categoriesSection}>
          <View style={styles.categoriesRow}>
            <Text style={styles.sectionTitle}>Ангилал</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/categories")}
              style={({ pressed }) => [styles.seeMoreWrap, pressed && styles.seeMorePressed]}
            >
              <Text style={styles.seeMore}>Бүгдийг харах</Text>
              <Ionicons name="chevron-forward" size={16} color="#8C1A7A" />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
            style={styles.categoriesScroll}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && styles.categoryCardPressed,
                ]}
                onPress={() => router.push({ pathname: "/categories/[category]", params: { category: c.id } })}
              >
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={c.iconFilled} size={38} color={c.iconColor} />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Онцлох бүтээгдэхүүн</Text>
        <View style={styles.productGrid}>
          {products.map((product) => (
            <View key={product.id} style={styles.productGridItem}>
              <ProductCard
                product={product}
                basketItem={basket[product.id]}
                variant="grid"
              />
            </View>
          ))}
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  bannerSlider: {
    marginBottom: 20,
  },
  bannerImage: {
    width: 320,
    height: 150,
    borderRadius: 18,
    marginRight: 12,
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  bannerTextContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "flex-end",
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#FFFFFF",
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  seeMoreWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  seeMorePressed: {
    opacity: 0.7,
  },
  seeMore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8C1A7A",
  },
  categoriesScroll: {
    marginHorizontal: -SCREEN_PADDING,
  },
  categoriesScrollContent: {
    flexDirection: "row",
    paddingHorizontal: SCREEN_PADDING,
    gap: CATEGORY_CARD_GAP,
    paddingRight: SCREEN_PADDING + 24,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d2d2d",
    textAlign: "center",
    lineHeight: 16,
  },
  productSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PRODUCT_GAP,
  },
  productGridItem: {
    width: PRODUCT_SIZE,
  },
});

