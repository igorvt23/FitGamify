import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft, UserPlus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/useTheme";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

type SignUpNav = StackNavigationProp<RootStackParamList, "SignUp">;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_LOGO = require("../img/logo_fitgamify.png");

const DEFAULT_SIGNUP_PROFILE = {
  phone: "00000000000",
  age: 18,
  heightCm: 170,
  weightKg: 70
} as const;

export function SignUpScreen() {
  const navigation = useNavigation<SignUpNav>();
  const { t } = useI18n();
  const { signUp } = useAppContext();
  const { typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = useMemo(() => (isDark ? darkPalette : lightPalette), [isDark]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage(t("signup.fillAll"));
      return;
    }
    if (password !== confirmPassword) {
      setMessage(t("signup.passwordMismatch"));
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: DEFAULT_SIGNUP_PROFILE.phone,
        age: DEFAULT_SIGNUP_PROFILE.age,
        heightCm: DEFAULT_SIGNUP_PROFILE.heightCm,
        weightKg: DEFAULT_SIGNUP_PROFILE.weightKg
      });
      navigation.replace("Login");
    } catch (error) {
      setMessage(mapSignUpError(error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: palette.screen }}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 30) }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroBlock}>
        <View style={[styles.logoWrap, { backgroundColor: palette.logoBg }]}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: palette.title, fontFamily: typography.heading }]}>{t("signup.title")}</Text>
        <Text style={[styles.subtitle, { color: palette.subtitle, fontFamily: typography.body }]}>{t("signup.subtitle")}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder, shadowColor: palette.cardShadow }]}>
        <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("signup.fullName")}</Text>
        <Input
          placeholder={t("signup.fullNamePlaceholder")}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor={palette.placeholder}
          style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
        />

        <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("signup.email")}</Text>
        <Input
          placeholder={t("signup.emailPlaceholder")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={palette.placeholder}
          style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
        />

        <View style={styles.passwordRow}>
          <View style={styles.passwordCol}>
            <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("signup.password")}</Text>
            <Input
              placeholder={t("signup.passwordPlaceholder")}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={palette.placeholder}
              style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
            />
          </View>
          <View style={styles.passwordCol}>
            <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("signup.confirmPassword")}</Text>
            <Input
              placeholder={t("signup.passwordPlaceholder")}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={palette.placeholder}
              style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
            />
          </View>
        </View>

        <Button
          label={loading ? `${t("signup.createAccount")}...` : t("signup.createAccount")}
          onPress={() => void handleSubmit()}
          disabled={loading}
          style={[styles.button, { backgroundColor: palette.successButton, borderColor: palette.successButtonBorder }]}
          leftIcon={<UserPlus size={16} color="#FFFFFF" />}
        />

        <Pressable style={styles.backWrap} onPress={() => navigation.navigate("Login")}>
          <ArrowLeft size={16} color={palette.subtitle} />
          <Text style={[styles.backText, { color: palette.subtitle, fontFamily: typography.title }]}>{t("signup.backToLogin")}</Text>
        </Pressable>

        {message ? (
          <Text style={[styles.message, { color: palette.errorText, borderColor: palette.errorBorder, backgroundColor: palette.errorBg }]}>
            {message}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const lightPalette = {
  screen: "#E5E7EB",
  logoBg: "#F3F4F6",
  title: "#142E57",
  subtitle: "#4E678C",
  cardBg: "#F3F4F6",
  cardBorder: "#CBD5E1",
  cardShadow: "#CBD5E1",
  label: "#183154",
  inputBg: "#DDE2EA",
  inputBorder: "#C8D0DD",
  placeholder: "#8FA1BE",
  successButton: "#06C755",
  successButtonBorder: "#05863A",
  errorText: "#9F1239",
  errorBorder: "#FCA5A5",
  errorBg: "#FFE4E6"
} as const;

const darkPalette = {
  screen: "#0F172A",
  logoBg: "#111827",
  title: "#F8FAFC",
  subtitle: "#AAB8CE",
  cardBg: "#1E293B",
  cardBorder: "#334155",
  cardShadow: "#000000",
  label: "#E2E8F0",
  inputBg: "#334155",
  inputBorder: "#475569",
  placeholder: "#94A3B8",
  successButton: "#22C55E",
  successButtonBorder: "#15803D",
  errorText: "#FCA5A5",
  errorBorder: "#7F1D1D",
  errorBg: "#3F1D1D"
} as const;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 26,
    paddingBottom: 36,
    gap: 18
  },
  heroBlock: {
    alignItems: "center",
    gap: 10
  },
  logoWrap: {
    width: 158,
    height: 158,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    width: 138,
    height: 138
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 50
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center"
  },
  card: {
    borderWidth: 2,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  label: {
    fontSize: 15,
    fontWeight: "900"
  },
  input: {
    borderRadius: 18,
    minHeight: 52,
    fontSize: 15,
    fontWeight: "700"
  },
  passwordRow: {
    flexDirection: "row",
    gap: 8
  },
  passwordCol: {
    flex: 1,
    gap: 8
  },
  button: {
    marginTop: 6,
    minHeight: 54,
    borderRadius: 16
  },
  backWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  backText: {
    fontSize: 16,
    fontWeight: "800"
  },
  message: {
    marginTop: 4,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700"
  }
});

function mapSignUpError(error: unknown, t: (key: string) => string) {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();
  if (message.includes("already registered")) {
    return t("signup.emailInUse");
  }
  if (message.includes("email not confirmed")) {
    return t("auth.emailNotConfirmed");
  }
  return raw || t("signup.genericError");
}
