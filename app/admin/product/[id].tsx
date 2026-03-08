import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { CATEGORIES } from "../../../constants/categories";
import { PRODUCT_UNITS } from "../../../constants/units";
import { SUGGESTED_TAGS } from "../../../constants/tags";
import { useAuth } from "../../../context/AuthContext";
import { useGrocery } from "../../../context/GroceryContext";
import * as adminApi from "../../../lib/admin-api";
import type { Product } from "../../../types/api";

const THEME = "#8C1A7A";

export default function AdminProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { refreshProducts } = useGrocery();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]?.id ?? "nariin-nogoo");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>(PRODUCT_UNITS[0]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isNew || !token) return;
    (async () => {
      try {
        const list = await adminApi.getAdminProducts(token);
        const p = list.find((x) => x.id === id) as Product | undefined;
        if (p) {
          setName(p.name);
          setCategoryId(p.category);
          setPrice(String(p.price));
          setUnit(p.unit?.trim() || PRODUCT_UNITS[0]);
          setDescription(p.description ?? "");
          setImages(p.images ?? []);
          setTags(p.tags ?? []);
        }
      } catch {
        setLoading(false);
      }
      setLoading(false);
    })();
  }, [id, isNew, token]);

  const pickAndUpload = useCallback(async () => {
    if (!token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Зургийн сангийн эрх шаардлагатай.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const url = await adminApi.uploadImage(token, {
        uri: asset.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });
      setImages((prev) => [...prev, url]);
    } catch (e) {
      Alert.alert("Алдаа", (e as Error).message ?? "Зураг оруулахад алдаа гарлаа.");
    }
  }, [token]);

  const pickAndOcr = useCallback(async () => {
    if (!token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Зургийн сангийн эрх шаардлагатай.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const text = await adminApi.ocrImage(token, { uri: asset.uri, type: "image/jpeg", name: "image.jpg" });
      if (text) setDescription((prev) => (prev ? prev + "\n" + text : text));
      else Alert.alert("Үр дүн", "Текст олдсонгүй.");
    } catch (e) {
      Alert.alert("Алдаа", (e as Error).message ?? "OCR амжилтгүй.");
    }
  }, [token]);

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!token) return;
    const p = parseFloat(price);
    if (!name.trim()) {
      Alert.alert("Алдаа", "Нэр оруулна уу.");
      return;
    }
    if (Number.isNaN(p) || p < 0) {
      Alert.alert("Алдаа", "Зөв үнэ оруулна уу.");
      return;
    }
    if (!unit?.trim()) {
      Alert.alert("Алдаа", "Нэгж оруулна уу.");
      return;
    }
    setSaving(true);
    try {
      const body = { name: name.trim(), categoryId, price: p, unit: unit?.trim() ?? PRODUCT_UNITS[0], description: description.trim() || undefined, images, tags };
      if (isNew) {
        await adminApi.createProduct(token, body);
        refreshProducts();
        Alert.alert("Амжилттай", "Бүтээгдэхүүн нэмэгдлээ.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        await adminApi.updateProduct(token, id, body);
        refreshProducts();
        Alert.alert("Амжилттай", "Шинэчлэгдлээ.", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (e) {
      Alert.alert("Алдаа", (e as { message?: string }).message ?? "Хадгалахад алдаа гарлаа.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Нэр</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Бүтээгдэхүүний нэр" placeholderTextColor="#999" />

      <Text style={styles.label}>Ангилал</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
            onPress={() => setCategoryId(c.id)}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Үнэ</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#999" />

      <Text style={styles.label}>Нэгж</Text>
      <View style={styles.chipRow}>
        {[
          ...PRODUCT_UNITS,
          ...(unit && !PRODUCT_UNITS.includes(unit as typeof PRODUCT_UNITS[number]) ? [unit] : []),
        ].map((u) => (
          <Pressable
            key={u}
            style={[styles.chip, unit === u && styles.chipActive]}
            onPress={() => setUnit(u)}
          >
            <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Тайлбар (OCR-оор дүүргэж болно)</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Тайлбар эсвэл зурагнаас текст татах" placeholderTextColor="#999" multiline numberOfLines={3} />
      <Pressable style={styles.outlineBtn} onPress={pickAndOcr}>
        <Ionicons name="document-text-outline" size={18} color={THEME} />
        <Text style={styles.outlineBtnText}>Зургаас текст татах (OCR)</Text>
      </Pressable>

      <Text style={styles.label}>Зургууд</Text>
      <View style={styles.imageRow}>
        {images.map((url, i) => (
          <View key={i} style={styles.imageWrap}>
            <Text style={styles.imageUrl} numberOfLines={1}>{url.slice(-24)}</Text>
            <Pressable style={styles.removeImg} onPress={() => removeImage(i)}>
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.uploadBtn} onPress={pickAndUpload}>
          <Ionicons name="image-outline" size={24} color={THEME} />
          <Text style={styles.uploadBtnText}>Зураг нэмэх</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Шошго (tags)</Text>
      <View style={styles.chipRow}>
        {SUGGESTED_TAGS.map((t) => (
          <Pressable key={t} style={[styles.chip, tags.includes(t) && styles.chipActive]} onPress={() => (tags.includes(t) ? removeTag(tags.indexOf(t)) : addTag(t))}>
            <Text style={[styles.chipText, tags.includes(t) && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tagInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={tagInput}
          onChangeText={setTagInput}
          placeholder="Шошго нэмэх"
          placeholderTextColor="#999"
          onSubmitEditing={() => addTag(tagInput)}
        />
        <Pressable style={styles.addTagBtn} onPress={() => addTag(tagInput)}>
          <Text style={styles.addTagBtnText}>+</Text>
        </Pressable>
      </View>
      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.filter((t) => !SUGGESTED_TAGS.includes(t as typeof SUGGESTED_TAGS[number])).map((t, i) => (
            <Pressable key={t} style={styles.chip} onPress={() => removeTag(tags.indexOf(t))}>
              <Text style={styles.chipText}>{t} ×</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>{isNew ? "Нэмэх" : "Хадгалах"}</Text>}
      </Pressable>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E1E1E1", paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#EEE", borderWidth: 1, borderColor: "#DDD" },
  chipActive: { backgroundColor: THEME, borderColor: THEME },
  chipText: { fontSize: 13, color: "#333" },
  chipTextActive: { color: "#FFF" },
  outlineBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: THEME },
  outlineBtnText: { fontSize: 14, fontWeight: "500", color: THEME },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  imageWrap: { backgroundColor: "#FFF", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E1E1E1", maxWidth: 120 },
  imageUrl: { fontSize: 11, color: "#666" },
  removeImg: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "#B00020", alignItems: "center", justifyContent: "center" },
  uploadBtn: { width: 100, height: 60, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: THEME, alignItems: "center", justifyContent: "center" },
  uploadBtnText: { fontSize: 12, color: THEME, marginTop: 4 },
  tagInputRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  addTagBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: THEME, alignItems: "center", justifyContent: "center" },
  addTagBtnText: { fontSize: 24, color: "#FFF", fontWeight: "600" },
  saveBtn: { marginTop: 24, backgroundColor: THEME, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
});
