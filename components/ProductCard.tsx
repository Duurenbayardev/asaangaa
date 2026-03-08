import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { getCategoryLabel } from "../constants/categories";
import { formatTugrug } from "../lib/formatCurrency";
import { resolveImageUrl } from "../lib/api-client";
import { BasketItem, Product, useGrocery } from "../context/GroceryContext";

const THEME_PRIMARY = "#8C1A7A";

type ProductCardProps = {
  product: Product;
  basketItem?: BasketItem;
  variant?: "list" | "grid";
};

function productImageUri(product: Product): string | undefined {
  const raw = product.images?.[0];
  if (!raw?.trim()) return undefined;
  return resolveImageUrl(raw) ?? (raw.startsWith("http") ? raw : undefined);
}

export function ProductCard({ product, basketItem, variant = "list" }: ProductCardProps) {
  const { toggleWishlist, wishlist } = useGrocery();
  const [imageError, setImageError] = useState(false);

  const quantity = basketItem?.quantity ?? 0;
  const inWishlist = wishlist.has(product.id);
  const uri = productImageUri(product);
  const showPlaceholder = !uri || imageError;

  const goToProduct = () =>
    router.push({ pathname: "/product/[id]", params: { id: product.id } });

  if (variant === "grid") {
    return (
      <Pressable style={styles.gridCard} onPress={goToProduct}>
        <View style={styles.gridImageWrap}>
          {showPlaceholder ? (
            <View style={[styles.gridImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#CCC" />
            </View>
          ) : (
            <Image
              source={{ uri }}
              style={styles.gridImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}
          <Pressable
            hitSlop={8}
            style={styles.gridWishlist}
            onPress={() => toggleWishlist(product)}
          >
            <Ionicons
              name={inWishlist ? "heart" : "heart-outline"}
              size={18}
              color={inWishlist ? THEME_PRIMARY : "#fff"}
            />
          </Pressable>
        </View>
        <Text style={styles.gridName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.gridPrice}>{formatTugrug(product.price)}</Text>
        {quantity > 0 && (
          <Text style={styles.gridQuantity}>Сагсанд: {quantity}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.row} onPress={goToProduct}>
        {showPlaceholder ? (
          <View style={[styles.thumbnail, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#CCC" />
          </View>
        ) : (
          <Image
            source={{ uri: uri! }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.meta}>
            {getCategoryLabel(product.category)} · {product.unit}
          </Text>
          <Text style={styles.price}>{formatTugrug(product.price)}</Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => toggleWishlist(product)}
          style={styles.wishlistButton}
        >
          <Ionicons
            name={inWishlist ? "heart" : "heart-outline"}
            size={20}
            color={inWishlist ? THEME_PRIMARY : "#B0B0B0"}
          />
        </Pressable>
      </Pressable>
      {quantity > 0 && (
        <View style={styles.footerRow}>
          <Text style={styles.quantityText}>Сагсанд: {quantity}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#F3F3F3",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111111",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },
  price: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  wishlistButton: {
    padding: 4,
  },
  footerRow: {
    marginTop: 12,
  },
  quantityText: {
    fontSize: 13,
    color: "#666666",
  },
  gridCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  gridImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F3F3",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridWishlist: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  gridPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME_PRIMARY,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  gridQuantity: {
    fontSize: 11,
    color: "#666666",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
});
