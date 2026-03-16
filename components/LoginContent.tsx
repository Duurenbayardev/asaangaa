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
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (showForgotPassword) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.hero} />
        <Image source={require("../assets/Group 3.png")} style={styles.heroImage} resizeMode="contain" />
        <View style={styles.formSection}>
          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Нууц үг сэргээх</Text>
            <Text style={styles.subtitle}>
              {forgotSuccess
                ? "Нууц үг амжилттай солигдлоо. Одоо нэвтрэнэ үү."
                : forgotStep === "email"
                  ? "И-мэйл хаягаа оруулбал баталгаажуулах код илгээнэ."
                  : "Имэйлээр ирсэн 6 оронтой кодыг болон шинэ нууц үгээ оруулна уу."}
            </Text>

            {forgotSuccess ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => { setShowForgotPassword(false); setForgotStep("email"); setForgotEmail(""); setForgotCode(""); setForgotSuccess(false); }}
              >
                <Text style={styles.primaryButtonText}>Нэвтрэх рүү буцах</Text>
              </TouchableOpacity>
            ) : forgotStep === "email" ? (
              <>
                <Text style={styles.label}>И-мэйл</Text>
                <TextInput
                  placeholder="имэйл@жишээ.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#B0B0B0"
                  value={forgotEmail}
                  onChangeText={(t) => { setForgotEmail(t); setError(null); }}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.primaryButton, styles.secondaryButtonMargin, auth.isLoading && styles.primaryButtonDisabled]}
                  onPress={async () => {
                    setError(null);
                    if (!forgotEmail.trim()) {
                      setError("И-мэйлээ оруулна уу.");
                      return;
                    }
                    try {
                      await auth.requestPasswordReset(forgotEmail.trim());
                      setForgotStep("code");
                    } catch (e: unknown) {
                      setError(e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Код илгээхэд алдаа гарлаа.");
                    }
                  }}
                  disabled={auth.isLoading}
                >
                  {auth.isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>Код илгээх</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => { setShowForgotPassword(false); setError(null); }}>
                  <Text style={styles.linkText}>Нэвтрэх рүү буцах</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>И-мэйл</Text>
                <Text style={[styles.input, styles.inputReadOnly]}>{forgotEmail}</Text>
                <Text style={[styles.label, styles.labelSpacing]}>Код</Text>
                <TextInput
                  placeholder="000000"
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholderTextColor="#B0B0B0"
                  value={forgotCode}
                  onChangeText={(t) => { setForgotCode(t.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                  maxLength={6}
                />
                <Text style={[styles.label, styles.labelSpacing]}>Шинэ нууц үг</Text>
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#B0B0B0"
                  value={forgotNewPassword}
                  onChangeText={(t) => { setForgotNewPassword(t); setError(null); }}
                />
                <Text style={[styles.label, styles.labelSpacing]}>Нууц үг давтах</Text>
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#B0B0B0"
                  value={forgotConfirmPassword}
                  onChangeText={(t) => { setForgotConfirmPassword(t); setError(null); }}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.primaryButton, styles.secondaryButtonMargin, (auth.isLoading || forgotCode.length !== 6 || forgotNewPassword.length < 8 || forgotNewPassword !== forgotConfirmPassword) && styles.primaryButtonDisabled]}
                  onPress={async () => {
                    setError(null);
                    if (forgotNewPassword.length < 8) {
                      setError("Нууц үг 8 тэмдэгтээс дээш байх ёстой.");
                      return;
                    }
                    if (forgotNewPassword !== forgotConfirmPassword) {
                      setError("Нууц үг тохирохгүй байна.");
                      return;
                    }
                    try {
                      await auth.resetPassword(forgotEmail.trim(), forgotCode, forgotNewPassword);
                      setForgotSuccess(true);
                    } catch (e: unknown) {
                      setError(e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Код буруу эсвэл хугацаа дууссан.");
                    }
                  }}
                  disabled={auth.isLoading || forgotCode.length !== 6 || forgotNewPassword.length < 8 || forgotNewPassword !== forgotConfirmPassword}
                >
                  {auth.isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>Нууц үг солих</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => { setForgotStep("email"); setForgotCode(""); setError(null); }}>
                  <Text style={styles.linkText}>Өөр имэйл ашиглах</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
        // onLoad={onHeroImageLoad}
      />
      <View style={styles.formSection}>
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleTab, !isSignUp && styles.toggleTabActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
                Нэвтрэх
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, isSignUp && styles.toggleTabActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
                Бүртгүүлэх
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            {isSignUp ? "Шинэ бүртгэл үүсгэх" : "Тавтай морилно уу"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? "Бүртгэл үүсгээд сагсаа дүүргээрэй."
              : "Нэвтэрч сагсаа дүүргээрэй."}
          </Text>

          {isSignUp && (
            <>
              <Text style={styles.label}>Нэр</Text>
              <TextInput
                placeholder="Нэрээ оруулна уу"
                style={styles.input}
                placeholderTextColor="#B0B0B0"
                value={name}
                onChangeText={setName}
              />
              <View style={styles.labelSpacing} />
            </>
          )}

          <Text style={styles.label}>И-мэйл</Text>
          <TextInput
            placeholder="имэйл@жишээ.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor="#B0B0B0"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Нууц үг</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#B0B0B0"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
          />

          {isSignUp && (
            <>
              <Text style={[styles.label, styles.labelSpacing]}>Нууц үг давтах</Text>
              <TextInput
                placeholder="••••••••"
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#B0B0B0"
                value={passwordConfirm}
                onChangeText={(t) => { setPasswordConfirm(t); setError(null); }}
              />
            </>
          )}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, auth.isLoading && styles.primaryButtonDisabled]}
            onPress={async () => {
              setError(null);
              if (!email.trim()) {
                setError("И-мэйлээ оруулна уу.");
                return;
              }
              if (!password) {
                setError("Нууц үгээ оруулна уу.");
                return;
              }
              if (isSignUp) {
                if (password.length < 8) {
                  setError("Нууц үг 8 тэмдэгтээс дээш байх ёстой.");
                  return;
                }
                if (password !== passwordConfirm) {
                  setError("Нууц үг тохирохгүй байна.");
                  return;
                }
              }
              try {
                if (isSignUp) {
                  await auth.signUp(email.trim(), password, name.trim() || undefined);
                } else {
                  await auth.login(email.trim(), password);
                }
                onContinue();
              } catch (e: unknown) {
                const msg = e && typeof e === "object" && "message" in e
                  ? String((e as { message: string }).message)
                  : "Холболт амжилтгүй. Дахин оролдоно уу.";
                setError(msg);
              }
            }}
            disabled={auth.isLoading}
          >
            {auth.isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? "Бүртгүүлэх" : "Нэвтрэх"}
              </Text>
            )}
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity style={styles.linkButton} onPress={() => setShowForgotPassword(true)}>
              <Text style={styles.linkText}>Нууц үгээ мартсан уу?</Text>
            </TouchableOpacity>
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
  toggleRow: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666666",
  },
  toggleTextActive: {
    color: THEME_PRIMARY,
    fontWeight: "600",
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
  labelSpacing: {
    marginTop: 16,
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
  secondaryButtonMargin: {
    marginTop: 20,
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
    color: THEME_PRIMARY,
  },
  inputReadOnly: {
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#C62828",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
