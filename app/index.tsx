import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { LoginContent } from "../components/LoginContent";

const THEME_PRIMARY = "#8C1A7A";
const THEME_BACKGROUND = "#FFFFFF";
const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SLIDES = [
  {
    id: "welcome",
    eyebrow: "Гэрийн тань үүдэнд",
    title: "Эх орны хөрсөнд ургасан ургац",
    description:
      "Өдөр бүр шинэ, эрүүл ахуй, чанарын стандарт хангасан аюулгүй орчинд тариалсан.",
  },
  {
    id: "plan",
    eyebrow: "Өдөр бүр шинэ.",
    title: "БҮРЭН АВТОMAT ДӨРВӨН УЛИРЛЫН ШИЛЭН ХҮЛЭМЖ.",
    description:
      "",
  },
  {
    id: "Түргэн Хүргэлт ",
    eyebrow: "Түргэн Хүргэлт",
    title: "Хүлэмжнээс таны гэр лүү хүргэж өгнө.",
    description:
      "Шинэ Эрүүл Монгол ургацыг хүргүүлэн авах боломжтой",
  },
];

export default function Index() {
  const { token, isRestored } = useAuth();
  const params = useLocalSearchParams<{ showLogin?: string }>();
  const [current, setCurrent] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginImageReady, setLoginImageReady] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const slideFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRestored) return;
    if (token) {
      router.replace("/(tabs)/home");
    }
  }, [isRestored, token]);

  // When navigating here after logout (or "Нэвтрэх") show the same login overlay with slide transition
  useEffect(() => {
    if (params.showLogin === "1" || params.showLogin === "true") {
      setShowLogin(true);
      const t = setTimeout(() => setLoginImageReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [params.showLogin]);

  useEffect(() => {
    Animated.timing(slideFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [slideFadeAnim]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== current) {
      setCurrent(next);
    }
  };

  const goToIndex = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ x: index * width, animated: true });
    setCurrent(index);
  };

  const handlePrimaryCta = () => {
    if (current < SLIDES.length - 1) {
      goToIndex(current + 1);
    } else {
      setShowLogin(true);
    }
  };

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
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [showLogin, loginImageReady]);

  const handleLoginContinue = () => {
    router.replace("/(tabs)/home");
  };

  const isLast = current === SLIDES.length - 1;

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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide) => (
            <Animated.View
              key={slide.id}
              style={[styles.slide, { opacity: slideFadeAnim }]}
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

        {/* Pagination + CTAs docked at bottom */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, index) => {
              const active = index === current;
              return (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    active && styles.dotActive,
                  ]}
                />
              );
            })}
          </View>

          {current >= 2 && (
            <View style={styles.ctaRow}>
              <Text
                style={styles.primaryCta}
                onPress={handlePrimaryCta}
              >
                {isLast ? "Эхлэх" : "Дараагийн"}
              </Text>
            </View>
          )}
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
          pointerEvents="box-none"
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
    paddingBottom: 32,
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
    marginTop: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E3E3E3",
  },
  dotActive: {
    width: 20,
    backgroundColor: THEME_PRIMARY,
  },
  ctaRow: {
    position: "absolute",
    bottom: 24,
    right: 24,
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

