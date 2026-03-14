import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const THEME_PRIMARY = "#8C1A7A";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;

type LoginContentProps = {
  onContinue: () => void;
  showHeader?: boolean;
  onHeroImageLoad?: () => void;
};

export function LoginContent({ onContinue, showHeader = false, onHeroImageLoad }: LoginContentProps) {
  const auth = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setError(null);
    const trimmed = phone.trim().replace(/\D/g, "");
    if (trimmed.length < 8) {
      setError("Утасны дугаараа зөв оруулна уу.");
      return;
    }
    try {
      await auth.requestOtp(phone.trim());
      setStep("code");
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "Код илгээхэд алдаа гарлаа. Дахин оролдоно уу.";
      setError(msg);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!code.trim() || code.trim().length < 4) {
      setError("Кодоо оруулна уу (4-6 орон).");
      return;
    }
    try {
      await auth.verifyOtp(phone.trim(), code.trim());
      onContinue();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "Код буруу байна. Дахин оролдоно уу.";
      setError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero} />
      <Image
        source={require("../assets/Group 3.png")}
        style={styles.heroImage}
        resizeMode="contain"
      />
      <View style={styles.formSection}>
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Нэвтрэх</Text>
          <Text style={styles.subtitle}>
            Утасны дугаараа оруулаад баталгаажуулах кодыг аваарай.
          </Text>

          {step === "phone" ? (
            <>
              <Text style={styles.label}>Утасны дугаар</Text>
              <TextInput
                placeholder="80123456 эсвэл 99123456"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#B0B0B0"
                value={phone}
                onChangeText={(t) => { setPhone(t); setError(null); }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryButton, auth.isLoading && styles.primaryButtonDisabled]}
                onPress={handleSendOtp}
                disabled={auth.isLoading}
              >
                {auth.isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Код авах</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Баталгаажуулах код</Text>
              <TextInput
                placeholder="SMS-ээр ирсэн 6 оронтой код"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                placeholderTextColor="#B0B0B0"
                value={code}
                onChangeText={(t) => { setCode(t); setError(null); }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryButton, auth.isLoading && styles.primaryButtonDisabled]}
                onPress={handleVerify}
                disabled={auth.isLoading}
              >
                {auth.isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Нэвтрэх</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => { setStep("phone"); setCode(""); setError(null); }}
              >
                <Text style={styles.backLinkText}>Өөр дугаар ашиглах</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  hero: {
    height: IMAGE_HEIGHT,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: "-40%",
    right: 0,
    width: "180%",
    height: IMAGE_HEIGHT,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: -50,
    paddingTop: 24,
  },
  formScroll: {
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#666666",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  input: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#FAFAFA",
  },
  primaryButton: {
    marginTop: 28,
    borderRadius: 12,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#C62828",
  },
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    fontSize: 14,
    color: "#666666",
  },
});
