import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoadingScreen } from "../components/LoadingScreen";
import { AuthProvider } from "../context/AuthContext";
import { GroceryProvider } from "../context/GroceryContext";

const INITIAL_LOAD_DURATION_MS = 1800;

export default function RootLayout() {
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [initialProgress, setInitialProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / INITIAL_LOAD_DURATION_MS) * 100);
      setInitialProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setShowInitialLoading(false), 200);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GroceryProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          {showInitialLoading && (
            <LoadingScreen progress={initialProgress} />
          )}
        </View>
      </GroceryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
