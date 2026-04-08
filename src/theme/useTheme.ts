import { useColorScheme } from "react-native";

import { useAppContext } from "../state/AppContext";
import { darkColors, lightColors, radius, shadow, spacing, typography } from "./tokens";

export function useTheme() {
  const { theme } = useAppContext();
  const system = useColorScheme();
  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    spacing,
    radius,
    shadow,
    typography
  };
}
