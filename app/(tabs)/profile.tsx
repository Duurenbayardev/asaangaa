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
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { useGrocery } from "../../context/GroceryContext";
import { formatTugrug } from "../../lib/formatCurrency";

const THEME_PRIMARY = "#8C1A7A";
const THEME_SOFT = "#FBE6F8";

function IconTile({
  icon,
  title,
  subtitle,
  color = THEME_PRIMARY,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.tileSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

function RowAction({
  icon,
  title,
  subtitle,
  rightText,
  color = THEME_PRIMARY,
  onPress,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  rightText?: string;
  color?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const content = (
    <View style={styles.rowAction}>
      <View style={[styles.rowActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowActionTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowActionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightText ? <Text style={styles.rowActionRight}>{rightText}</Text> : null}
      {onPress && showChevron ? <Ionicons name="chevron-forward" size={18} color="#B0B0B0" /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, token, isRestored, sendVerificationEmail, verifyEmail, logout: authLogout, isLoading: authLoading } = useAuth();
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const { addresses, basket, wishlist, total, userVerified } = useGrocery();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Зочлон худалдан авагч";

  const basketCount = Object.values(basket).reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.size;

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    authLogout();
    router.replace("/?login=1");
  };

  if (isRestored && !token) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ScrollView
          contentContainerStyle={[styles.scroll, styles.guestScroll]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />
            <View style={styles.avatarRing}>
              <Image source={require("../../assets/logo.png")} style={styles.avatar} resizeMode="contain" />
            </View>
            <Text style={styles.userName}>Зочлон худалдан авагч</Text>
            <Text style={styles.userMeta}>Нэвтрэхээр захиалга, хаяг хадгалах боломжтой</Text>
          </View>
          <TouchableOpacity
            style={styles.loginCtaButton}
            onPress={() => router.replace("/?login=1")}
          >
            <Text style={styles.loginCtaButtonText}>Нэвтрэх</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const primaryAddressText =
    addresses.length === 0
      ? "Хаяг хадгалагдаагүй"
      : `${addresses[0].fullName || "Хадгалсан хаяг"} · ${addresses[0].city}`;

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroTopRow}>
            <View style={styles.avatarRing}>
              <Image source={require("../../assets/logo.png")} style={styles.avatar} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.userMeta} numberOfLines={1}>{user ? user.email : "Нэвтрээгүй"}</Text>
            </View>
          </View>

          <View style={styles.statsPillsRow}>
            <View style={styles.pill}>
              <Ionicons name="cart-outline" size={16} color={THEME_PRIMARY} />
              <Text style={styles.pillText}>{basketCount} · {formatTugrug(total)}</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="heart-outline" size={16} color={THEME_PRIMARY} />
              <Text style={styles.pillText}>{wishlistCount} хадгалсан</Text>
            </View>
          </View>
        </View>

        <View style={styles.tilesGrid}>
          <IconTile
            icon="receipt-outline"
            title="Захиалга"
            subtitle="Түүх харах"
            onPress={() => router.push("/orders")}
          />
          <IconTile
            icon="location-outline"
            title="Хаяг"
            subtitle={primaryAddressText}
            onPress={() => router.push("/checkout/address")}
          />
          <IconTile
            icon="cart-outline"
            title="Сагс"
            subtitle={`${basketCount} ширхэг`}
            onPress={() => router.push("/(tabs)/basket")}
          />
          {user?.role === "admin" ? (
            <IconTile
              icon="settings-outline"
              title="Админ"
              subtitle="Удирдлага"
              onPress={() => router.push("/admin")}
            />
          ) : (
            <IconTile
              icon="help-circle-outline"
              title="Тусламж"
              subtitle="Холбоо барих"
              onPress={() => router.push("/notifications")}
              color="#2D6CDF"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тохиргоо & Мэдээлэл</Text>
          <View style={styles.card}>
            <RowAction
              icon={userVerified ? "shield-checkmark" : "shield-outline"}
              title="Баталгаажуулалт"
              subtitle={userVerified ? "Баталгаажсан" : "Имэйлээр баталгаажуулна"}
              rightText={userVerified ? "OK" : "!"}
              color={userVerified ? "#2E7D32" : THEME_PRIMARY}
              showChevron={false}
            />

            {!userVerified && user && (
              <View style={styles.inlineBlock}>
                <Text style={styles.otpHint}>Имэйлээр ирсэн 6 оронтой кодыг оруулна уу.</Text>
                {!verificationCodeSent ? (
                  <TouchableOpacity
                    style={[styles.verifyButton, authLoading && styles.verifyButtonDisabled]}
                    onPress={async () => {
                      setVerificationError(null);
                      try {
                        await sendVerificationEmail();
                        setVerificationCodeSent(true);
                      } catch (e: unknown) {
                        setVerificationError(
                          e && typeof e === "object" && "message" in e
                            ? String((e as { message: string }).message)
                            : "Код илгээхэд алдаа гарлаа."
                        );
                      }
                    }}
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                    )}
                    <Text style={styles.verifyButtonText}>Код илгээх</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor="#B0B0B0"
                      value={verificationCode}
                      onChangeText={(t) => {
                        setVerificationCode(t.replace(/\D/g, "").slice(0, 6));
                        setVerificationError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {verificationError ? <Text style={styles.otpError}>{verificationError}</Text> : null}
                    <View style={styles.otpRow}>
                      <TouchableOpacity
                        style={styles.otpSecondaryBtn}
                        onPress={async () => {
                          setVerificationCode("");
                          setVerificationError(null);
                          try {
                            await sendVerificationEmail();
                          } catch {
                            setVerificationError("Дахин илгээхэд алдаа гарлаа.");
                          }
                        }}
                        disabled={authLoading}
                      >
                        <Text style={styles.otpSecondaryText}>Дахин</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.verifyButton, (authLoading || verificationCode.length !== 6) && styles.verifyButtonDisabled]}
                        onPress={async () => {
                          setVerificationError(null);
                          try {
                            await verifyEmail(verificationCode);
                            setVerificationCode("");
                            setVerificationCodeSent(false);
                          } catch (e: unknown) {
                            setVerificationError(
                              e && typeof e === "object" && "message" in e
                                ? String((e as { message: string }).message)
                                : "Код буруу эсвэл хугацаа дууссан."
                            );
                          }
                        }}
                        disabled={authLoading || verificationCode.length !== 6}
                      >
                        {authLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        )}
                        <Text style={styles.verifyButtonText}>Баталгаажуулах</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.divider} />

            <RowAction
              icon="person-outline"
              title="Бүртгэл"
              subtitle={displayName}
              rightText={user?.email ?? ""}
              showChevron={false}
            />

            <View style={styles.divider} />

            <RowAction
              icon="location-outline"
              title="Хүргэлтийн хаяг"
              subtitle={primaryAddressText}
              onPress={() => router.push("/checkout/address")}
            />

            <View style={styles.divider} />

            <RowAction
              icon="cart-outline"
              title="Сагсны мэдээлэл"
              subtitle={`${basketCount} ширхэг`}
              rightText={formatTugrug(total)}
              onPress={() => router.push("/(tabs)/basket")}
            />
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
    paddingTop: 16,
  },
  guestScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 48,
  },
  heroHeader: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFF0",
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroBlob1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: THEME_SOFT,
    top: -80,
    right: -70,
  },
  heroBlob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E9F2FF",
    bottom: -70,
    left: -60,
  },
  loginCtaButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: THEME_PRIMARY,
    alignItems: "center",
  },
  loginCtaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  userMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },
  statsPillsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFF0",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  tile: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFEFF0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  tileSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777777",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFF0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLabel: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  cardValueMuted: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "600",
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B00020",
  },
  logoutConfirmCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
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
    borderRadius: 14,
    backgroundColor: "#F3F3F5",
  },
  logoutConfirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  logoutConfirmOk: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
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
    paddingHorizontal: 16,
    borderRadius: 14,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 8,
    color: "#111",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  otpError: { fontSize: 13, color: "#C62828", marginBottom: 8 },
  otpRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 },
  otpSecondaryBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  otpSecondaryText: { fontSize: 15, fontWeight: "600", color: "#666" },
  rowAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  rowActionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777777",
  },
  rowActionRight: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444444",
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F2",
  },
  inlineBlock: {
    paddingTop: 8,
    paddingBottom: 10,
  },
});
