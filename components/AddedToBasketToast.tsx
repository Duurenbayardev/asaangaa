import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const THEME_PRIMARY = "#8C1A7A";

type AddedToBasketToastProps = {
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
};

export function AddedToBasketToast({
  visible,
  onDismiss,
  duration = 2500,
}: AddedToBasketToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.toast}>
        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
        <Text style={styles.text}>Сагсанд нэмэгдлээ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 100,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
