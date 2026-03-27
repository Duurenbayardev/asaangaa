import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getAdminSettings, updateAdminSettings } from "../../lib/admin-api";

const THEME = "#8C1A7A";

export default function AdminSettingsScreen() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token || user?.role !== "admin") return;
      setLoading(true);
      setError(null);
      try {
        const s = await getAdminSettings(token);
        if (!mounted) return;
        setDeliveryFee(String(s.deliveryFee));
        setDeliveryFreeThreshold(String(s.deliveryFreeThreshold));
        setTaxRate(String(Math.round(s.taxRate * 100)));
        setTaxEnabled(Boolean(s.taxEnabled));
        setSupportPhone(s.supportPhone ?? "");
        setSupportEmail(s.supportEmail ?? "");
      } catch (e: unknown) {
        if (!mounted) return;
        const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Тохиргоо уншихад алдаа гарлаа.";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, user?.role]);

  if (user?.role !== "admin") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Зөвхөн админ нэвтэрнэ.</Text>
      </View>
    );
  }

  const onSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setOk(null);
    const payload = {
      deliveryFee: Number(deliveryFee || 0),
      deliveryFreeThreshold: Number(deliveryFreeThreshold || 0),
      taxEnabled,
      taxRate: Number(taxRate || 0) / 100,
      supportPhone: supportPhone.trim(),
      supportEmail: supportEmail.trim(),
    };
    if (!Number.isFinite(payload.deliveryFee) || payload.deliveryFee < 0) {
      setError("Хүргэлтийн үнэ зөв биш байна.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(payload.deliveryFreeThreshold) || payload.deliveryFreeThreshold < 0) {
      setError("Үнэгүй хүргэлтийн босго зөв биш байна.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(payload.taxRate) || payload.taxRate < 0 || payload.taxRate > 1) {
      setError("НӨАТ хувь 0-100 хооронд байна.");
      setSaving(false);
      return;
    }
    if (payload.supportPhone.length < 3) {
      setError("Холбоо барих утас дутуу байна.");
      setSaving(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.supportEmail)) {
      setError("И-мэйл хаяг буруу байна.");
      setSaving(false);
      return;
    }
    try {
      const s = await updateAdminSettings(token, payload);
      setDeliveryFee(String(s.deliveryFee));
      setDeliveryFreeThreshold(String(s.deliveryFreeThreshold));
      setTaxRate(String(Math.round(s.taxRate * 100)));
      setTaxEnabled(Boolean(s.taxEnabled));
      setSupportPhone(s.supportPhone ?? "");
      setSupportEmail(s.supportEmail ?? "");
      setOk("Тохиргоо хадгалагдлаа.");
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Хадгалахад алдаа гарлаа.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={THEME} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Хүргэлтийн үнэ</Text>
            <TextInput
              style={styles.input}
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="decimal-pad"
              placeholder="4.99"
              placeholderTextColor="#999"
            />

            <Text style={[styles.label, styles.space]}>Үнэгүй хүргэлтийн босго</Text>
            <TextInput
              style={styles.input}
              value={deliveryFreeThreshold}
              onChangeText={setDeliveryFreeThreshold}
              keyboardType="decimal-pad"
              placeholder="30"
              placeholderTextColor="#999"
            />

            <View style={[styles.row, styles.space]}>
              <Text style={styles.label}>НӨАТ тооцох</Text>
              <Switch value={taxEnabled} onValueChange={setTaxEnabled} trackColor={{ true: "#DDB1D5" }} thumbColor={taxEnabled ? THEME : "#CCC"} />
            </View>

            <Text style={[styles.label, styles.space]}>НӨАТ хувь (%)</Text>
            <TextInput
              style={styles.input}
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor="#999"
            />

            <Text style={[styles.label, styles.space]}>Тусламж утас</Text>
            <TextInput
              style={styles.input}
              value={supportPhone}
              onChangeText={setSupportPhone}
              keyboardType="phone-pad"
              placeholder="+97699119911"
              placeholderTextColor="#999"
            />

            <Text style={[styles.label, styles.space]}>Тусламж имэйл</Text>
            <TextInput
              style={styles.input}
              value={supportEmail}
              onChangeText={setSupportEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="support@asaangaa.mn"
              placeholderTextColor="#999"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {ok ? <Text style={styles.okText}>{ok}</Text> : null}

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={saving ? undefined : onSave}>
            <Text style={styles.saveBtnText}>{saving ? "Хадгалж байна..." : "Хадгалах"}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E8E8E8", padding: 14 },
  label: { fontSize: 14, fontWeight: "600", color: "#222" },
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
  },
  space: { marginTop: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  saveBtn: { marginTop: 18, borderRadius: 12, backgroundColor: THEME, alignItems: "center", paddingVertical: 13 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  errorText: { marginTop: 12, color: "#C62828", fontSize: 13 },
  okText: { marginTop: 12, color: "#2E7D32", fontSize: 13 },
});

