import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LoginContent } from "../components/LoginContent";
import { useAuth } from "../context/AuthContext";

const THEME_PRIMARY = "#8C1A7A";
const THEME_BACKGROUND = "#FFFFFF";
const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const INITIAL_LOADING_OVERLAY_MS = 2000; // keep in sync with app/_layout.tsx loader timing

const SLIDES = [
  {
    id: "welcome",
    eyebrow: "Гэрийн тань үүдэнд",
    title: "Эх орны хөрсөнд ургасан ургац",
    description:
      "Өдөр бүр шинэ, эрүүл ахуй, чанарын стандарт хангасан, аюулгүй орчинд тариалсан.",
  },
];

export default function Index() {
  const params = useLocalSearchParams<{ login?: string }>();
  const { token, isRestored } = useAuth();
  const openLoginFromParam = params.login === "1";
  const [showLogin, setShowLogin] = useState(openLoginFromParam);
  const [loginImageReady, setLoginImageReady] = useState(openLoginFromParam);
  const [showPrimaryCta, setShowPrimaryCta] = useState(openLoginFromParam);
  const scrollRef = useRef<ScrollView | null>(null);
  const slideAnim = useRef(new Animated.Value(openLoginFromParam ? 0 : -SCREEN_HEIGHT)).current;
  const slideFadeAnim = useRef(new Animated.Value(0)).current;
  const slideRiseAnim = useRef(new Animated.Value(openLoginFromParam ? 0 : 10)).current;
  const ctaFadeAnim = useRef(new Animated.Value(openLoginFromParam ? 1 : 0)).current;

  useEffect(() => {
    if (!isRestored) return;
    if (token) {
      router.replace("/(tabs)/home");
    }
  }, [isRestored, token]);

  useEffect(() => {
    if (!openLoginFromParam) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: (SLIDES.length - 1) * width, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [openLoginFromParam, isRestored]);

  useEffect(() => {
    if (showLogin) return;
    slideFadeAnim.setValue(0);
    slideRiseAnim.setValue(10);
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideRiseAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, INITIAL_LOADING_OVERLAY_MS);
    return () => clearTimeout(t);
  }, [showLogin, slideFadeAnim, slideRiseAnim]);

  const handlePrimaryCta = () => setShowLogin(true);

  useEffect(() => {
    if (showLogin) return;
    setShowPrimaryCta(false);
    ctaFadeAnim.setValue(0);
    const t = setTimeout(() => {
      setShowPrimaryCta(true);
      Animated.timing(ctaFadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, INITIAL_LOADING_OVERLAY_MS + 3000);
    return () => clearTimeout(t);
  }, [showLogin, ctaFadeAnim]);

  useEffect(() => {
    if (!showLogin) return;
    setLoginImageReady(false);
    const fallback = setTimeout(() => setLoginImageReady(true), 400);
    return () => clearTimeout(fallback);
  }, [showLogin]);

  useEffect(() => {
    if (!showLogin || !loginImageReady) return;
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 560,
      useNativeDriver: true,
    }).start();
  }, [showLogin, loginImageReady]);

  const handleLoginContinue = () => {
    router.replace("/(tabs)/home");
  };

  if (!isRestored || token) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sliderShell}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          scrollEnabled={false}
        >
          {SLIDES.map((slide) => (
            <Animated.View
              key={slide.id}
              style={[styles.slide, { opacity: slideFadeAnim, transform: [{ translateY: slideRiseAnim }] }]}
            >
              <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* CTA docked at bottom */}
        <View style={styles.footer}>
          {showPrimaryCta ? (
            <Animated.View style={[styles.ctaRow, { opacity: ctaFadeAnim }]}>
              <Text
                style={styles.primaryCta}
                onPress={handlePrimaryCta}
              >
                Үргэлжлүүлэх
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </View>

      {showLogin && (
        <Animated.View
          style={[
            styles.loginOverlay,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
          pointerEvents="auto"
        >
          <LoginContent onContinue={handleLoginContinue} onHeroImageLoad={() => setLoginImageReady(true)} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_BACKGROUND,
  },
  logo: {
    height: 80,
    marginBottom: 16,
  },
  sliderShell: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 0,
  },
  slide: {
    width,
    paddingHorizontal: 24,
    paddingTop: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: THEME_PRIMARY,
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    minHeight: 96,
    justifyContent: "flex-end",
    paddingBottom: 34,
  },
  ctaRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCta: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
  },
  primaryCta: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: THEME_PRIMARY,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    overflow: "hidden",
  },
  loginOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
});

