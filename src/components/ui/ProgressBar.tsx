import React from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type ProgressBarProps = {
  value: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, style }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const animatedValue = React.useRef(new Animated.Value(clamped)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: clamped,
      useNativeDriver: false,
      bounciness: 7,
      speed: 14
    }).start();
  }, [animatedValue, clamped]);

  const fillWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.pill,
          borderColor: colors.border
        },
        style
      ]}
    >
      <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: colors.primary, borderRadius: radius.pill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 14,
    borderWidth: 2,
    overflow: "hidden"
  },
  fill: {
    height: "100%"
  }
});
