import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Header } from "../../components/Header";
import { ProductCard } from "../../components/ProductCard";
import { getCategoriesOrdered } from "../../constants/categories";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";

const BANNER_COUNT = 2;

const SCREEN_PADDING = 20;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Bigger tiles: 3.5 visible in width → horizontally scrollable
const HOME_CATEGORY_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP * 3) / 3.5;
const HOME_CATEGORY_HEIGHT = HOME_CATEGORY_WIDTH * 1.05;
const PRODUCT_GAP = 12;
const PRODUCT_SIZE = (SCREEN_WIDTH - SCREEN_PADDING * 2 - PRODUCT_GAP) / 2;

const CATEGORIES = getCategoriesOrdered();

export default function HomeScreen() {
  const { user } = useAuth();
  const { products, basket } = useGrocery();
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "хэрэглэгч";
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
      {showLoading && <LoadingScreen progress={loadingProgress} />}
      <Header />
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

        <View style={styles.categoriesRow}>
          <Text style={styles.sectionTitle}>Ангилал</Text>
          <Pressable onPress={() => router.push("/(tabs)/categories")}>
            <Text style={styles.seeMore}>Бүгдийг харах</Text>
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
              style={[
                styles.chip,
                {
                  width: HOME_CATEGORY_WIDTH,
                  height: HOME_CATEGORY_HEIGHT,
                  backgroundColor: c.bg,
                },
              ]}
              onPress={() => router.push({ pathname: "/categories/[category]", params: { category: c.id } })}
            >
              <Ionicons name={c.icon} size={28} color="#37474F" />
              <Text style={styles.chipLabel} numberOfLines={2}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

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
  categoriesRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoriesScroll: {
    marginHorizontal: -SCREEN_PADDING,
    marginBottom: 16,
  },
  categoriesScrollContent: {
    flexDirection: "row",
    paddingHorizontal: SCREEN_PADDING,
    paddingRight: SCREEN_PADDING + 8,
  },
  chip: {
    marginRight: GAP,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#37474F",
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  seeMore: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8C1A7A",
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

