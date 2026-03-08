import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const THEME_PRIMARY = "#8C1A7A";

type VerificationBannerProps = {
  visible: boolean;
  onGoToProfile: () => void;
  onDismiss?: () => void;
};

export function VerificationBanner({
  visible,
  onGoToProfile,
  onDismiss,
}: VerificationBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Баталгаажаагүй. Худалдан авалт хийхийн тулд баталгаажуулна уу.</Text>
      <View style={styles.row}>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>Болих</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoToProfile}>
          <Text style={styles.primaryText}>Профайл руу</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFE0B2",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dismissText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  primaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: THEME_PRIMARY,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
