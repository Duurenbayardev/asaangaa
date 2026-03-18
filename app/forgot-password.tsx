import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BackButton } from "../components/BackButton";
import * as authApi from "../lib/auth-api";

const THEME_PRIMARY = "#8C1A7A";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canRequest = useMemo(() => email.trim().length > 3, [email]);
  const canReset = useMemo(() => {
    return (
      email.trim().length > 3 &&
      code.trim().length === 6 &&
      newPassword.length >= 8 &&
      newPassword === newPasswordConfirm
    );
  }, [code, email, newPassword, newPasswordConfirm]);

  const requestCode = async () => {
    if (!canRequest || loading) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await authApi.forgotPassword(email.trim());
      setStep("reset");
      setInfo("Хэрэв имэйл бүртгэлтэй бол сэргээх код илгээгдсэн.");
    } catch (e: unknown) {
      let msg =
        e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Алдаа гарлаа.";
      if (/timed out|Network request failed|NETWORK_ERROR/i.test(msg)) {
        msg +=
          " Сүлжээний хаяг (EXPO_PUBLIC_API_URL) зөв эсэх, компьютерт backend ажиллаж байгаа эсэхийг шалгана уу.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    if (!canReset || loading) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      setInfo("Нууц үг амжилттай шинэчлэгдлээ. Нэвтэрч орно уу.");
      setTimeout(() => router.replace("/login"), 700);
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Алдаа гарлаа.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <BackButton fallbackHref="/login" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.title}>Нууц үг сэргээх</Text>
          <Text style={styles.subtitle}>
            {step === "request"
              ? "Имэйлээ оруулаад 6 оронтой сэргээх код авна."
              : "Кодоо болон шинэ нууц үгээ оруулна уу."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>И-мэйл</Text>
          <TextInput
            style={styles.input}
            placeholder="имэйл@жишээ.com"
            placeholderTextColor="#B0B0B0"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType={step === "request" ? "done" : "next"}
            onSubmitEditing={step === "request" ? requestCode : undefined}
          />

          {step === "reset" && (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>Код</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#B0B0B0"
                keyboardType="number-pad"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                returnKeyType="next"
              />

              <Text style={[styles.label, { marginTop: 14 }]}>Шинэ нууц үг</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                returnKeyType="next"
              />

              <Text style={[styles.label, { marginTop: 14 }]}>Нууц үг давтах</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                value={newPasswordConfirm}
                onChangeText={setNewPasswordConfirm}
                returnKeyType="done"
                onSubmitEditing={doReset}
              />
            </>
          )}

          {info ? <Text style={styles.infoText}>{info}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {step === "request" ? (
            <Pressable style={[styles.primaryBtn, (!canRequest || loading) && styles.btnDisabled]} onPress={requestCode}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Код авах</Text>}
            </Pressable>
          ) : (
            <>
              <Pressable style={[styles.primaryBtn, (!canReset || loading) && styles.btnDisabled]} onPress={doReset}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Нууц үг солих</Text>}
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => {
                  setStep("request");
                  setCode("");
                  setNewPassword("");
                  setNewPasswordConfirm("");
                  setInfo(null);
                  setError(null);
                }}
              >
                <Text style={styles.secondaryBtnText}>Код дахин авах</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  content: { paddingHorizontal: 20, paddingTop: 88, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 16 },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#666", textAlign: "center", lineHeight: 18 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFF0",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#333" },
  input: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#FAFAFA",
  },
  infoText: { marginTop: 12, fontSize: 13, color: "#2E7D32" },
  errorText: { marginTop: 12, fontSize: 13, color: "#C62828" },
  primaryBtn: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  secondaryBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: THEME_PRIMARY },
  btnDisabled: { opacity: 0.7 },
});

