import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/RootNavigator";

type SignUpNav = StackNavigationProp<RootStackParamList, "SignUp">;

export function SignUpScreen() {
  const navigation = useNavigation<SignUpNav>();
  const { t } = useI18n();
  const { signUp } = useAppContext();

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
      Alert.alert(t("signup.error"), error instanceof Error ? error.message : t("signup.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("signup.title")}</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>{t("signup.fullName")}</Text>
        <TextInput style={styles.input} placeholder={t("signup.fullName")} value={fullName} onChangeText={setFullName} />
        <Text style={styles.fieldLabel}>{t("signup.age")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("signup.age")}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <Text style={styles.fieldLabel}>{t("signup.heightCm")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("signup.heightCm")}
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="numeric"
        />
        <Text style={styles.fieldLabel}>{t("signup.weightKg")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("signup.weightKg")}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="numeric"
        />
        <Text style={styles.fieldLabel}>{t("signup.email")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("signup.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.fieldLabel}>{t("signup.phone")}</Text>
        <TextInput style={styles.input} placeholder={t("signup.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.fieldLabel}>{t("signup.password")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("signup.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={() => void handleSubmit()} disabled={loading}>
          <Text style={styles.buttonText}>{t("signup.createAccount")}</Text>
        </Pressable>
      </View>
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
  card: {
    backgroundColor: "#F3F5F7",
    borderRadius: 12,
    padding: 12,
    gap: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151"
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  }
});
