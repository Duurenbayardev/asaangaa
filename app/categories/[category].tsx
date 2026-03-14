import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BackButton } from "../../components/BackButton";
import { ProductCard } from "../../components/ProductCard";
import { getCategoryById } from "../../constants/categories";
import { useGrocery } from "../../context/GroceryContext";

const PAD = 20;

const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRODUCT_SIZE = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

export default function CategoryDetailScreen() {
  const { category: categorySlug } = useLocalSearchParams<{ category: string }>();
  const { products, basket } = useGrocery();
  const categoryConfig = useMemo(
    () => (categorySlug ? getCategoryById(categorySlug) : undefined),
    [categorySlug]
  );

  const filtered = useMemo(
    () =>
      categorySlug
        ? products.filter((p) => p.category === categorySlug)
        : [],
    [products, categorySlug]
  );

  if (!categorySlug || !categoryConfig) {
    return (
      <View style={styles.container}>
        <BackButton />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Энэ ангилал байхгүй байна.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productGrid}>
          {filtered.map((product) => (
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: PAD,
    paddingTop: 72,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  productGridItem: {
    width: PRODUCT_SIZE,
  },
});
