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
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999
} as const;

export const palette = {
  white: "#FFFFFF",
  black: "#0B0B0B",
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617"
  },
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
  background: palette.slate[50],
  surface: palette.white,
  surfaceAlt: "#FEE2E2",
  surfaceMuted: palette.slate[100],
  surfaceRaised: "#FFFFFF",
  text: palette.slate[800],
  textMuted: palette.slate[500],
  border: palette.slate[200],
  primary: palette.red[500],
  primarySoft: "#FEE2E2",
  primaryStrong: palette.red[600],
  primaryShadow: palette.red[700],
  success: palette.green[500],
  warning: palette.yellow[500],
  danger: palette.red[600],
  chip: palette.white,
  chipText: palette.slate[700],
  tabBar: palette.white,
  tabBarBorder: palette.slate[200],
  inputBg: palette.slate[100]
};

export const darkColors: ThemeColors = {
  background: palette.slate[950],
  surface: palette.slate[900],
  surfaceAlt: "#2A1A1A",
  surfaceMuted: palette.slate[800],
  surfaceRaised: palette.slate[900],
  text: palette.slate[50],
  textMuted: palette.slate[400],
  border: palette.slate[700],
  primary: palette.red[400],
  primarySoft: "#3F1D1D",
  primaryStrong: palette.red[300],
  primaryShadow: palette.red[700],
  success: "#22C55E",
  warning: "#F59E0B",
  danger: palette.red[400],
  chip: palette.slate[800],
  chipText: palette.slate[200],
  tabBar: palette.slate[900],
  tabBarBorder: palette.slate[700],
  inputBg: palette.slate[800]
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
    shadowOpacity: 0.18,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  }
} as const;
