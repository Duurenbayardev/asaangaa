import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../../components/Header";
import { formatTugrug } from "../../lib/formatCurrency";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";

export default function ProfileScreen() {
  const { user, sendOtp, verifyOtp, logout: authLogout, isLoading: authLoading } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const { addresses, basket, wishlist, total, userVerified } = useGrocery();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Зочлон худалдан авагч";

  const basketCount = Object.values(basket).reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.size;

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    authLogout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Header title="Профайл" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userMeta}>{user ? user.email : "Нэвтрээгүй"}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{basketCount}</Text>
            <Text style={styles.statLabel}>Сагсанд</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Хадгалсан</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTugrug(total)}</Text>
            <Text style={styles.statLabel}>Сагсын нийт</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Баталгаажуулалт</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons
                name={userVerified ? "shield-checkmark" : "shield-outline"}
                size={20}
                color={userVerified ? "#2E7D32" : "#666666"}
              />
              <Text style={styles.cardLabel}>Худалдан авалтын баталгаажуулалт</Text>
              <Text style={[styles.cardValue, !userVerified && styles.cardValueMuted]}>
                {userVerified ? "Баталгаажсан" : "Баталгаажаагүй"}
              </Text>
            </View>
            {!userVerified && user && (
              <View style={styles.otpBlock}>
                {!otpSent ? (
                  <TouchableOpacity
                    style={[styles.verifyButton, authLoading && styles.verifyButtonDisabled]}
                    onPress={async () => {
                      setOtpError(null);
                      try {
                        await sendOtp();
                        setOtpSent(true);
                      } catch (e: unknown) {
                        setOtpError(e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Код илгээхэд алдаа гарлаа.");
                      }
                    }}
                    disabled={authLoading}
                  >
                    {authLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="mail-outline" size={20} color="#FFFFFF" />}
                    <Text style={styles.verifyButtonText}>И-мэйл рүү OTP код илгээх</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.otpHint}>И-мэйлээр ирсэн 6 оронтой кодыг оруулна уу.</Text>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor="#B0B0B0"
                      value={otpCode}
                      onChangeText={(t) => { setOtpCode(t.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}
                    <View style={styles.otpRow}>
                      <TouchableOpacity style={styles.otpSecondaryBtn} onPress={() => { setOtpSent(false); setOtpCode(""); setOtpError(null); }}>
                        <Text style={styles.otpSecondaryText}>Буцах</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.verifyButton, (authLoading || otpCode.length !== 6) && styles.verifyButtonDisabled]}
                        onPress={async () => {
                          setOtpError(null);
                          try {
                            await verifyOtp(otpCode);
                            setOtpSent(false);
                            setOtpCode("");
                          } catch (e: unknown) {
                            setOtpError(e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Код буруу байна.");
                          }
                        }}
                        disabled={authLoading || otpCode.length !== 6}
                      >
                        {authLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
                        <Text style={styles.verifyButtonText}>Баталгаажуулах</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Захиалга</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/orders")}
            activeOpacity={0.8}
          >
            <View style={styles.cardRow}>
              <Ionicons name="receipt-outline" size={20} color="#8C1A7A" />
              <Text style={[styles.cardLabel, { color: "#8C1A7A", fontWeight: "600" }]}>Миний захиалга</Text>
              <Ionicons name="chevron-forward" size={20} color="#8C1A7A" />
            </View>
          </TouchableOpacity>
        </View>

        {user?.role === "admin" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Удирдлага</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/admin")}
              activeOpacity={0.8}
            >
              <View style={styles.cardRow}>
                <Ionicons name="settings-outline" size={20} color="#8C1A7A" />
                <Text style={[styles.cardLabel, { color: "#8C1A7A", fontWeight: "600" }]}>Админ панел</Text>
                <Ionicons name="chevron-forward" size={20} color="#8C1A7A" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Бүртгэл</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="person-outline" size={20} color="#666666" />
              <Text style={styles.cardLabel}>Харагдах нэр</Text>
              <Text style={styles.cardValue}>{displayName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Хүргэлт</Text>
          <View style={styles.card}>
            {addresses.length === 0 ? (
              <View style={styles.cardRow}>
                <Ionicons name="location-outline" size={20} color="#666666" />
                <Text style={styles.cardLabel}>Үндсэн хаяг</Text>
                <Text style={styles.cardValueMuted}>Хадгалагдаагүй</Text>
              </View>
            ) : (
              <View style={styles.addressBlock}>
                <View style={styles.cardRow}>
                  <Ionicons name="location-outline" size={20} color="#666666" />
                  <Text style={styles.cardLabel}>Үндсэн хаяг</Text>
                </View>
                <Text style={styles.addressText}>
                  {addresses[0].fullName || "Хадгалсан хаяг"}
                  {"\n"}
                  {addresses[0].line1}
                  {addresses[0].line2 ? `, ${addresses[0].line2}` : ""}
                  {"\n"}
                  {addresses[0].city}
                  {addresses[0].postalCode ? ` ${addresses[0].postalCode}` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Апп</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="cart-outline" size={20} color="#666666" />
              <Text style={styles.cardLabel}>Сагсын тойм</Text>
              <Text style={styles.cardValue}>
                {basketCount} ширхэг · {formatTugrug(total)}
              </Text>
            </View>
          </View>
        </View>

        {showLogoutConfirm ? (
          <View style={styles.logoutConfirmCard}>
            <Text style={styles.logoutConfirmText}>
              Гарах уу? Тавтай морилно уу дэлгэц рүү буцана.
            </Text>
            <View style={styles.logoutConfirmRow}>
              <TouchableOpacity
                style={styles.logoutConfirmCancel}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.logoutConfirmCancelText}>Цуцлах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmOk}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.logoutConfirmOkText}>Гарах</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <Ionicons name="log-out-outline" size={20} color="#B00020" />
            <Text style={styles.logoutText}>Гарах</Text>
          </TouchableOpacity>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 56,
    height: 56,
  },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  userMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#8C1A7A",
  },
  statLabel: {
    fontSize: 12,
    color: "#777777",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#EEEEEE",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333333",
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111111",
  },
  cardValueMuted: {
    fontSize: 14,
    color: "#999999",
  },
  addressBlock: {
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
    marginLeft: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFFFFF",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B00020",
  },
  logoutConfirmCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  logoutConfirmText: {
    fontSize: 15,
    color: "#333333",
    marginBottom: 16,
  },
  logoutConfirmRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  logoutConfirmCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  logoutConfirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  logoutConfirmOk: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#B00020",
  },
  logoutConfirmOkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  otpBlock: { marginTop: 12 },
  otpHint: { fontSize: 13, color: "#666", marginBottom: 8 },
  otpInput: {
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 8,
    color: "#111",
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
  },
  otpError: { fontSize: 13, color: "#C62828", marginBottom: 8 },
  otpRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 },
  otpSecondaryBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  otpSecondaryText: { fontSize: 15, fontWeight: "600", color: "#666" },
});
