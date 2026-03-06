import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/RootNavigator";

type SettingsNav = StackNavigationProp<RootStackParamList, "MainTabs">;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { t } = useI18n();
  const { theme, setTheme, language, setLanguage, authUser, signIn, signOut, backupNow, restoreBackupNow, errors } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      setMessage(t("settings.authSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  const handleBackup = async () => {
    try {
      await backupNow();
      setMessage(t("settings.backupSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.backupError"));
    }
  };

  const handleRestore = async () => {
    try {
      await restoreBackupNow();
      setMessage(t("settings.restoreSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.backupError"));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("settings.themeLabel")}</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => setTheme("light")}>
            <Text style={styles.buttonText}>{t("settings.theme.light")}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setTheme("dark")}>
            <Text style={styles.buttonText}>{t("settings.theme.dark")}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setTheme("system")}>
            <Text style={styles.buttonText}>{t("settings.theme.system")}</Text>
          </Pressable>
        </View>
        <Text>{t("settings.current")}: {theme}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => setLanguage("pt-BR")}>
            <Text style={styles.buttonText}>PT-BR</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setLanguage("en")}>
            <Text style={styles.buttonText}>EN</Text>
          </Pressable>
        </View>
        <Text>{t("settings.current")}: {language}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("settings.login")}</Text>
        {authUser ? (
          <>
            <Text>
              {t("auth.loggedInAs")}: {authUser.email}
            </Text>
            <Pressable style={styles.buttonDanger} onPress={() => void signOut()}>
              <Text style={styles.buttonText}>{t("settings.logout")}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>{t("settings.email")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("settings.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.fieldLabel}>{t("settings.password")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("settings.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.row}>
              <Pressable style={styles.button} onPress={() => void handleSignIn()}>
                <Text style={styles.buttonText}>{t("settings.signin")}</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.buttonText}>{t("settings.createAccount")}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("settings.cloudSync")}</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => void handleBackup()}>
            <Text style={styles.buttonText}>{t("settings.backupNow")}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => void handleRestore()}>
            <Text style={styles.buttonText}>{t("settings.restoreNow")}</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>{t("settings.cloudHint")}</Text>
      </View>

      {message ? (
        <View style={styles.card}>
          <Text>{message}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("settings.errors")}</Text>
        {errors.length === 0 ? (
          <Text>{t("settings.noErrors")}</Text>
        ) : (
          errors.map((entry) => (
            <View key={entry.id} style={styles.errorLine}>
              <Text style={styles.errorCategory}>{entry.category}</Text>
              <Text>{entry.message}</Text>
            </View>
          ))
        )}
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
    padding: 12,
    borderRadius: 12,
    gap: 10
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 16
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#ffffff"
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151"
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  buttonDanger: {
    backgroundColor: "#B91C1C",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  },
  hint: {
    color: "#4b5563",
    fontSize: 12
  },
  errorLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d0d7de",
    paddingTop: 6
  },
  errorCategory: {
    fontWeight: "700"
  }
});
