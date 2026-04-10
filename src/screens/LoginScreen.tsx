import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowRight, UserPlus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList } from "../navigation/RootNavigator";
import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export type LoginNav = StackNavigationProp<RootStackParamList, "Login">;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_LOGO = require("../img/logo_fitgamify.png");

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const { t } = useI18n();
  const { signIn, authUser } = useAppContext();
  const { typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = useMemo(() => (isDark ? darkPalette : lightPalette), [isDark]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      navigation.replace("MainTabs");
    }
  }, [authUser, navigation]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage(t("signup.fillAll"));
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await signIn(email, password);
      navigation.replace("MainTabs");
    } catch (error) {
      setMessage(mapAuthError(error, t));
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
        <View style={styles.logoWrap}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: palette.title, fontFamily: typography.heading }]}>{t("login.title")}</Text>
        <Text style={[styles.subtitle, { color: palette.subtitle, fontFamily: typography.body }]}>{t("login.subtitle")}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder, shadowColor: palette.cardShadow }]}>
        <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("login.email")}</Text>
        <Input
          placeholder={t("login.emailPlaceholder")}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={palette.placeholder}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
        />

        <Text style={[styles.label, { color: palette.label, fontFamily: typography.title }]}>{t("login.password")}</Text>
        <Input
          placeholder={t("login.passwordPlaceholder")}
          secureTextEntry
          placeholderTextColor={palette.placeholder}
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.label }]}
        />

        <Pressable onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotWrap}>
          <Text style={[styles.forgotText, { color: palette.subtitle, fontFamily: typography.title }]}>{t("login.forgotPassword")}</Text>
        </Pressable>

        <Button
          label={loading ? `${t("login.signin")}...` : t("login.signin")}
          onPress={() => void handleSignIn()}
          disabled={loading}
          style={[styles.button, { backgroundColor: palette.primaryButton, borderColor: palette.primaryButtonBorder }]}
          leftIcon={<ArrowRight size={16} color="#FFFFFF" />}
        />

        <Button
          label={t("login.createAccount")}
          variant="secondary"
          onPress={() => navigation.navigate("SignUp")}
          style={[styles.button, { backgroundColor: palette.cardBg, borderColor: palette.inputBorder }]}
          leftIcon={<UserPlus size={16} color={palette.label} />}
        />

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
  title: "#142E57",
  subtitle: "#4E678C",
  cardBg: "#F3F4F6",
  cardBorder: "#CBD5E1",
  cardShadow: "#CBD5E1",
  label: "#183154",
  inputBg: "#DDE2EA",
  inputBorder: "#C8D0DD",
  placeholder: "#8FA1BE",
  primaryButton: "#FF2538",
  primaryButtonBorder: "#BF0F1F",
  errorText: "#9F1239",
  errorBorder: "#FCA5A5",
  errorBg: "#FFE4E6"
} as const;

const darkPalette = {
  screen: "#0F172A",
  title: "#F8FAFC",
  subtitle: "#AAB8CE",
  cardBg: "#1E293B",
  cardBorder: "#334155",
  cardShadow: "#000000",
  label: "#E2E8F0",
  inputBg: "#334155",
  inputBorder: "#475569",
  placeholder: "#94A3B8",
  primaryButton: "#EF4444",
  primaryButtonBorder: "#B91C1C",
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
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: 6
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "800"
  },
  button: {
    marginTop: 4,
    minHeight: 54,
    borderRadius: 16
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

function mapAuthError(error: unknown, t: (key: string) => string) {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();
  if (message.includes("email not confirmed")) {
    return t("auth.emailNotConfirmed");
  }
  if (message.includes("invalid login credentials")) {
    return t("auth.invalidCredentials");
  }
  return raw || t("settings.authError");
}
