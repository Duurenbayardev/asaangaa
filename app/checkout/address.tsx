import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BackButton } from "../../components/BackButton";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";

const THEME_PRIMARY = "#8C1A7A";

export default function CheckoutAddressScreen() {
  const { token, isRestored } = useAuth();
  const { addresses, addAddress, setCheckoutAddress } = useGrocery();

  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(addresses[0]?.id ?? null);
  const [useNew, setUseNew] = useState(addresses.length === 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isRestored && !token) {
      router.replace("/?login=1");
    }
  }, [isRestored, token]);

  if (isRestored && !token) {
    return null;
  }

  const canUseSaved = selectedId != null && addresses.length > 0 && !useNew;
  const canUseNew =
    useNew &&
    fullName.trim().length >= 1 &&
    line1.trim().length >= 1 &&
    city.trim().length >= 1;

  const handleContinue = async () => {
    if (canUseSaved) {
      const addr = addresses.find((a) => a.id === selectedId);
      if (addr) {
        setCheckoutAddress(addr);
        router.push("/checkout/confirm");
      }
      return;
    }
    if (canUseNew) {
      setSubmitting(true);
      try {
        const created = await addAddress({
          fullName: fullName.trim() || undefined,
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          postalCode: postalCode.trim() || undefined,
          instructions: instructions.trim() || undefined,
        });
        setCheckoutAddress(created);
        router.push("/checkout/confirm");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const canContinue = canUseSaved || canUseNew;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Хаяг сонгох</Text>

        {addresses.length > 0 && (
          <View style={styles.savedList}>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.savedCard,
                  selectedId === addr.id && !useNew && styles.savedCardActive,
                ]}
                onPress={() => {
                  setSelectedId(addr.id);
                  setUseNew(false);
                }}
              >
                <Text style={styles.savedName}>{addr.fullName || "Хадгалсан хаяг"}</Text>
                <Text style={styles.savedBody}>
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  {"\n"}
                  {addr.city}
                  {addr.postalCode ? ` ${addr.postalCode}` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.newCard, useNew && styles.newCardActive]}
          onPress={() => setUseNew(true)}
        >
          <Text style={styles.newCardTitle}>Шинэ хаяг нэмэх</Text>
        </TouchableOpacity>

        {useNew && (
          <View style={styles.form}>
            <Text style={styles.formLabel}>Нэр</Text>
            <TextInput
              style={styles.input}
              placeholder="Бүтэн нэрээ оруулна уу"
              placeholderTextColor="#B0B0B0"
              value={fullName}
              onChangeText={setFullName}
            />
            <Text style={[styles.formLabel, styles.formLabelSpacing]}>Гэрийн хаяг *</Text>
            <TextInput
              style={styles.input}
              placeholder="Хот, Аймаг"
              placeholderTextColor="#B0B0B0"
              value={line1}
              onChangeText={setLine1}
            />
            <TextInput
              style={[styles.input, styles.inputSpacing]}
              placeholder="Дүүрэг, баг"
              placeholderTextColor="#B0B0B0"
              value={line2}
              onChangeText={setLine2}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Хороо"
                placeholderTextColor="#B0B0B0"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Хаалганы дугаар"
                placeholderTextColor="#B0B0B0"
                value={postalCode}
                onChangeText={setPostalCode}
              />
            </View>
            <TextInput
              style={[styles.input, styles.inputSpacing]}
              placeholder="Нэмэлт мэдээлэл"
              placeholderTextColor="#B0B0B0"
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, (!canContinue || submitting) && styles.continueButtonDisabled]}
          onPress={canContinue && !submitting ? handleContinue : undefined}
          disabled={submitting}
        >
          <Text style={styles.continueButtonText}>{submitting ? "Түр хүлээнэ үү..." : "Энэ хаягийг ашиглах"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  savedList: { gap: 10, marginBottom: 16 },
  savedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  savedCardActive: {
    borderColor: THEME_PRIMARY,
    backgroundColor: "#FFF6FE",
  },
  savedName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  savedBody: {
    fontSize: 13,
    color: "#555555",
    marginTop: 4,
  },
  newCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderStyle: "dashed",
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  newCardActive: {
    borderColor: THEME_PRIMARY,
    backgroundColor: "#FFF6FE",
  },
  newCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME_PRIMARY,
  },
  form: { marginTop: 16 },
  formLabel: { fontSize: 14, fontWeight: "500", color: "#333333" },
  formLabelSpacing: { marginTop: 14 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  inputSpacing: { marginTop: 8 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  halfInput: { flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E4",
  },
  continueButton: {
    borderRadius: 12,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#D2B5CC",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
