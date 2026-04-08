export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999
} as const;

export const palette = {
  white: "#FFFFFF",
  black: "#0B0B0B",
  red: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D"
  },
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827"
  },
  green: {
    500: "#16A34A",
    600: "#15803D"
  },
  yellow: {
    500: "#F59E0B"
  }
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  primaryStrong: string;
  primaryShadow: string;
  success: string;
  warning: string;
  danger: string;
  chip: string;
  chipText: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
};

export const lightColors: ThemeColors = {
  background: "#F6F8FC",
  surface: "#FFFFFF",
  surfaceAlt: "#FFECEE",
  surfaceMuted: "#F2F5FA",
  surfaceRaised: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#5F6B7A",
  border: "#E4E9F2",
  primary: "#FF2D2D",
  primarySoft: "#FFE1E1",
  primaryStrong: "#E11D2E",
  primaryShadow: "#FFD3D3",
  success: palette.green[500],
  warning: palette.yellow[500],
  danger: palette.red[600],
  chip: "#FFE7EA",
  chipText: "#C1121F",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E6ECF4",
  inputBg: "#F3F6FB"
};

export const darkColors: ThemeColors = {
  background: "#0B0F17",
  surface: "#141A26",
  surfaceAlt: "#1F1720",
  surfaceMuted: "#1A2232",
  surfaceRaised: "#1B2333",
  text: "#F8FAFC",
  textMuted: "#A5B0C2",
  border: "#273244",
  primary: "#FF4D4D",
  primarySoft: "#3A1B22",
  primaryStrong: "#FF8A8A",
  primaryShadow: "#40161D",
  success: "#22C55E",
  warning: "#FBBF24",
  danger: "#EF4444",
  chip: "#2B1B20",
  chipText: "#FFB4BE",
  tabBar: "#101624",
  tabBarBorder: "#1C2433",
  inputBg: "#0F1420"
};

export const typography = {
  heading: "Nunito_800ExtraBold",
  title: "Nunito_700Bold",
  body: "Nunito_600SemiBold",
  regular: "Nunito_400Regular"
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  }
} as const;
