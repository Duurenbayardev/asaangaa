import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BackButton } from "../components/BackButton";
import { getApiBaseUrl, parseJsonResponse } from "../lib/api-client";

export default function NotificationsScreen() {
  const [phone, setPhone] = useState("+97699119911");
  const [email, setEmail] = useState("support@asaangaa.mn");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/contact`);
        const data = (await parseJsonResponse(res)) as { supportPhone?: string; supportEmail?: string };
        if (!res.ok || !mounted) return;
        if (data.supportPhone) setPhone(data.supportPhone);
        if (data.supportEmail) setEmail(data.supportEmail);
      } catch {
        // fallback to defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openPhone = async () => {
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  const openMail = async () => {
    const url = `mailto:${email}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton fallbackHref="/(tabs)/home" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyWrap}>
          <View style={styles.iconWrap}>
            <Ionicons name="help-circle-outline" size={56} color="#8C1A7A" />
          </View>
          <Text style={styles.emptyTitle}>Тусламж & Холбоо барих</Text>
          <Text style={styles.emptyText}>
            Асуудал гарвал доорх утас болон имэйлээр холбогдоно уу.
          </Text>
          <TouchableOpacity style={styles.contactBtn} onPress={openPhone}>
            <Ionicons name="call-outline" size={18} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>{phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.contactBtnSecondary]} onPress={openMail}>
            <Ionicons name="mail-outline" size={18} color="#8C1A7A" />
            <Text style={styles.contactBtnTextSecondary}>{email}</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
  },
  iconWrap: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  contactBtn: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#8C1A7A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  contactBtnSecondary: {
    backgroundColor: "#F7EEF5",
    borderWidth: 1,
    borderColor: "#E9D2E3",
  },
  contactBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  contactBtnTextSecondary: {
    color: "#8C1A7A",
    fontSize: 15,
    fontWeight: "600",
  },
});
