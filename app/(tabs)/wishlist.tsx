import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "../../components/Header";
import { ProductCard } from "../../components/ProductCard";
import { useGrocery } from "../../context/GroceryContext";

const PAD = 20;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRODUCT_SIZE = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

export default function WishlistScreen() {
  const { products, wishlist, basket } = useGrocery();

  const items = products.filter((p) => wishlist.has(p.id));

  return (
    <View style={styles.container}>
      <Header title="Хадгалсан" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <Text style={styles.emptyText}>
            Хадгалсан жагсаалтад одоогоор юм байхгүй. Бүтээгдэхүүн дээрх зүрх дарж энд хадгална уу.
          </Text>
        ) : (
          <View style={styles.productGrid}>
            {items.map((product) => (
              <View key={product.id} style={styles.productGridItem}>
                <ProductCard
                  product={product}
                  basketItem={basket[product.id]}
                  variant="grid"
                />
              </View>
            ))}
          </View>
        )}
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
    paddingHorizontal: PAD,
    paddingTop: 16,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 14,
    color: "#777777",
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
