import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

type SignUpNav = StackNavigationProp<RootStackParamList, "SignUp">;

export function SignUpScreen() {
  const navigation = useNavigation<SignUpNav>();
  const { t } = useI18n();
  const { signUp } = useAppContext();
  const { colors, typography } = useTheme();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !email || !phone || !password || !age || !heightCm || !weightKg) {
      Alert.alert(t("signup.error"), t("signup.fillAll"));
      return;
    }

    setLoading(true);
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg)
      });
      Alert.alert(t("signup.successTitle"), t("signup.successDesc"));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("signup.error"), mapSignUpError(error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("signup.title")}</Text>

      <Card>
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.fullName")}</Text>
        <Input placeholder={t("signup.fullName")} value={fullName} onChangeText={setFullName} />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.age")}</Text>
        <Input placeholder={t("signup.age")} value={age} onChangeText={setAge} keyboardType="numeric" />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.heightCm")}</Text>
        <Input placeholder={t("signup.heightCm")} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.weightKg")}</Text>
        <Input placeholder={t("signup.weightKg")} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.email")}</Text>
        <Input placeholder={t("signup.email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.phone")}</Text>
        <Input placeholder={t("signup.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.body }]}>{t("signup.password")}</Text>
        <Input placeholder={t("signup.password")} value={password} onChangeText={setPassword} secureTextEntry />

        <Button label={t("signup.createAccount")} onPress={() => void handleSubmit()} disabled={loading} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  fieldLabel: {
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
