import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

const THEME_PRIMARY = "#8C1A7A";

type HeaderProps = {
  title?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
};

export function Header({ title, leftElement, rightElement }: HeaderProps) {
  return (
    <View style={styles.container}>
      {leftElement != null ? (
        <View style={styles.leftSlot}>{leftElement}</View>
      ) : null}
      <Pressable
        style={styles.center}
        onPress={() => router.replace("/(tabs)/home")}
        hitSlop={8}
      >
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Pressable>
      {rightElement != null ? (
        <View style={styles.rightSlot}>{rightElement}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSlot: {
    minWidth: 32,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  rightSlot: {
    minWidth: 32,
    alignItems: "flex-end",
  },
  logo: {
    height: 60,
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
  },
});

