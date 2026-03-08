import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PROGRESS_BAR_HEIGHT = 6;
const THEME_PURPLE = "#8C1A7A";

type LoadingScreenProps = {
  progress: number; // 0–100
  blocking?: boolean;
};

export function LoadingScreen({ progress, blocking = true }: LoadingScreenProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const barWidth = (SCREEN_WIDTH * clamped) / 100;

  return (
    <View style={styles.container} pointerEvents={blocking ? "auto" : "none"}>
      <View style={styles.middleBlock}>
        <Text style={styles.percent}>{Math.round(clamped)}%</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F5F5F7",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  middleBlock: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
  percent: {
    fontSize: 28,
    fontWeight: "700",
    color: THEME_PURPLE,
    marginBottom: 16,
  },
  barTrack: {
    width: "100%",
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "#E8E8E8",
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: "hidden",
  },
  barFill: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: THEME_PURPLE,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
});
