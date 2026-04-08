import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export type LoginNav = StackNavigationProp<RootStackParamList, "Login">;

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const { t } = useI18n();
  const { signIn, authUser } = useAppContext();
  const { colors, typography } = useTheme();
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
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={[styles.heroIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primaryShadow }]}>
          <MaterialCommunityIcons name="dumbbell" color={colors.primary} size={26} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("login.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.regular }]}>{t("login.subtitle")}</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={[styles.label, { color: colors.text, fontFamily: typography.body }]}>{t("login.email")}</Text>
        <Input
          placeholder={t("login.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={[styles.label, { color: colors.text, fontFamily: typography.body }]}>{t("login.password")}</Text>
        <Input placeholder={t("login.password")} secureTextEntry value={password} onChangeText={setPassword} />

        <Button
          label={t("login.signin")}
          onPress={() => void handleSignIn()}
          disabled={loading}
          style={styles.fullWidth}
          leftIcon={<MaterialCommunityIcons name="arrow-right-circle" size={18} color="#FFFFFF" />}
        />
        <Button
          label={t("login.createAccount")}
          variant="outline"
          onPress={() => navigation.navigate("SignUp")}
          style={styles.fullWidth}
          leftIcon={<MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.text} />}
        />

        <Pressable style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]} onPress={() => setMessage(t("login.googleHint"))}>
          <MaterialCommunityIcons name="google" size={18} color={colors.text} />
          <Text style={[styles.googleText, { color: colors.text }]}>{t("login.google")}</Text>
        </Pressable>
      </Card>

      {message ? (
        <View style={[styles.message, { borderColor: colors.border }]}> 
          <Text style={{ color: colors.text }}>{message}</Text>
        </View>
      ) : null}

      <Text style={[styles.footer, { color: colors.textMuted, fontFamily: typography.regular }]}>{t("login.footer")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16
  },
  hero: {
    gap: 8
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  label: {
    fontSize: 13,
    fontWeight: "700"
  },
  formCard: {
    borderRadius: 18,
    padding: 18,
    gap: 12
  },
  fullWidth: {
    width: "100%"
  },
  googleButton: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  googleText: {
    fontWeight: "700"
  },
  message: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12
  },
  footer: {
    fontSize: 12,
    textAlign: "center"
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
