import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Header } from "../../components/Header";
import { getCategoriesOrdered } from "../../constants/categories";
import { useGrocery } from "../../context/GroceryContext";

const PAD = 20;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_SIZE = SCREEN_WIDTH - PAD * 2;

export default function CategoriesScreen() {
  const { products } = useGrocery();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const categories = getCategoriesOrdered();
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? categories.filter((c) =>
          c.label.toLowerCase().includes(normalizedQuery)
        )
      : categories;
    return filtered.map((c) => ({
      ...c,
      count: products.filter((p) => p.category === c.id).length,
    }));
  }, [query, products]);

  return (
    <View style={styles.container}>
      <Header title="Ангилал" />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Ангилал хайх"
          placeholderTextColor="#B0B0B0"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {results.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.tile, { backgroundColor: cat.bg }]}
            onPress={() =>
              router.push({
                pathname: "/categories/[category]",
                params: { category: cat.id },
              })
            }
          >
            <Ionicons name={cat.icon} size={36} color="#37474F" />
            <View style={{ flex: 1 }}>
            <Text style={styles.tileLabel}>{cat.label}</Text>
            <Text style={styles.tileMeta}>
              {cat.count} бүтээгдэхүүн
            </Text>
            </View>
          </Pressable>
        ))}
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
  searchWrap: {
    paddingHorizontal: PAD,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  search: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    color: "#111111",
  },
  list: {
    paddingHorizontal: PAD,
    paddingTop: 16,
  },
  tile: {
    width: TILE_SIZE,
    borderRadius: 20, 
    padding: 18,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  tileLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    marginTop: 12,
  },
  tileMeta: {
    fontSize: 14,
    color: "#555555",
    marginTop: 4,
  },
});
