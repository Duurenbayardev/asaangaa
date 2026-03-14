import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Href = Parameters<typeof router.replace>[0];

type BackButtonProps = {
  fallbackHref?: Href;
  style?: ViewStyle;
  color?: string;
};

export function BackButton({ fallbackHref = "/(tabs)/home", style, color = "#111111" }: BackButtonProps) {
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackHref);
    } catch {
      router.replace(fallbackHref);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      style={[styles.button, { top: insets.top + 10 }, style]}
    >
      <Ionicons name="chevron-back" size={26} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 14,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
});

