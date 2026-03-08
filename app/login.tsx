import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Header } from "../components/Header";
import { LoginContent } from "../components/LoginContent";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Нэвтрэх" />
      <Animated.View
        style={[styles.slideWrap, { transform: [{ translateY: slideAnim }] }]}
      >
        <LoginContent onContinue={() => router.replace("/(tabs)/home")} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slideWrap: {
    flex: 1,
  },
});
