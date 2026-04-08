import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Chip } from "../components/ui/Chip";
import { FitnessGoal, Weekday } from "../types";

type SettingsNav = StackNavigationProp<RootStackParamList, "MainTabs">;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { t } = useI18n();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    authUser,
    signIn,
    signOut,
    backupNow,
    restoreBackupNow,
    workoutReminderSettings,
    updateWorkoutReminderSettings,
    profile,
    updateProfile
  } = useAppContext();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [reminderWeekdays, setReminderWeekdays] = useState<Weekday[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setDisplayName(profile.displayName ?? "");
    setAge(profile.age == null ? "" : String(profile.age));
    setHeightCm(profile.heightCm == null ? "" : String(profile.heightCm));
    setWeightKg(profile.weightKg == null ? "" : String(profile.weightKg));
    setGoal(profile.goal ?? null);
  }, [profile]);

  useEffect(() => {
    setReminderEnabled(workoutReminderSettings.enabled);
    setReminderTime(formatReminderTime(workoutReminderSettings.hour, workoutReminderSettings.minute));
    setReminderWeekdays(workoutReminderSettings.weekdays);
  }, [workoutReminderSettings]);

  const weekLabels = useMemo(() => {
    const translated = t("dashboard.weekdays") as unknown;
    return Array.isArray(translated) && translated.length === 7 ? translated : ["D", "S", "T", "Q", "Q", "S", "S"];
  }, [t]);

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

  const handleSaveProfile = async () => {
    const parsedAge = age.trim() === "" ? null : Number(age);
    const parsedHeight = heightCm.trim() === "" ? null : Number(heightCm);
    const parsedWeight = weightKg.trim() === "" ? null : Number(weightKg);

    await updateProfile({
      displayName: displayName.trim() || profile?.displayName || "Atleta",
      age: Number.isNaN(parsedAge ?? 0) ? null : parsedAge,
      heightCm: Number.isNaN(parsedHeight ?? 0) ? null : parsedHeight,
      weightKg: Number.isNaN(parsedWeight ?? 0) ? null : parsedWeight,
      goal
    });
    setMessage(t("settings.profileSaved"));
  };

  const handleGoalSelect = async (nextGoal: FitnessGoal) => {
    setGoal(nextGoal);
    try {
      await updateProfile({ goal: nextGoal });
      setMessage(t("settings.profileSaved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  const toggleReminderWeekday = (weekday: Weekday) => {
    setReminderWeekdays((current) => {
      if (current.includes(weekday)) {
        return current.filter((item) => item !== weekday);
      }
      return [...current, weekday].sort((a, b) => a - b);
    });
  };

  const handleSaveReminder = async () => {
    const parsed = parseReminderTime(reminderTime);
    if (!parsed) {
      setMessage(t("settings.reminderInvalidTime"));
      return;
    }
    if (reminderEnabled && reminderWeekdays.length === 0) {
      setMessage(t("settings.reminderSelectDay"));
      return;
    }
    try {
      await updateWorkoutReminderSettings({
        enabled: reminderEnabled,
        hour: parsed.hour,
        minute: parsed.minute,
        weekdays: [...new Set(reminderWeekdays)].sort((a, b) => a - b) as Weekday[]
      });
      setMessage(t("settings.reminderSaved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.backupError"));
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
    >
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("settings.title")}</Text>

      <Card style={styles.accountCard}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ color: colors.primary, fontFamily: typography.heading }}>
                {(displayName || "A").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.accountName, { color: colors.text, fontFamily: typography.title }]}>{displayName || t("settings.defaultName")}</Text>
              <Text style={{ color: colors.textMuted }}>{authUser?.email ?? t("settings.notLogged")}</Text>
            </View>
          </View>
          {authUser ? (
            <Button label={t("settings.logout")} variant="danger" size="sm" onPress={() => void handleSignOut()} />
          ) : null}
        </View>
        {!authUser ? (
          <View style={styles.loginBlock}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.email")}</Text>
            <Input
              placeholder={t("settings.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.password")}</Text>
            <Input placeholder={t("settings.password")} value={password} onChangeText={setPassword} secureTextEntry />
            <View style={styles.row}>
              <Button label={t("settings.signin")} onPress={() => void handleSignIn()} />
              <Button label={t("settings.createAccount")} variant="outline" onPress={() => navigation.navigate("SignUp")} />
            </View>
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("settings.profileTitle")}</Text>
        </View>
        <Text style={{ color: colors.textMuted }}>{t("settings.profileHint")}</Text>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.displayName")}</Text>
        <Input value={displayName} onChangeText={setDisplayName} placeholder={t("settings.displayName")} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("signup.age")}</Text>
            <Input value={age} onChangeText={setAge} keyboardType="numeric" placeholder={t("signup.age")} />
          </View>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("signup.heightCm")}</Text>
            <Input value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder={t("signup.heightCm")} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("signup.weightKg")}</Text>
            <Input value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder={t("signup.weightKg")} />
          </View>
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.goal")}</Text>
        <View style={styles.row}>
          <Chip label={t("settings.goalLose")} selected={goal === "lose"} onPress={() => void handleGoalSelect("lose")} />
          <Chip label={t("settings.goalGain")} selected={goal === "gain"} onPress={() => void handleGoalSelect("gain")} />
          <Chip
            label={t("settings.goalMaintain")}
            selected={goal === "maintain"}
            onPress={() => void handleGoalSelect("maintain")}
          />
        </View>
        <Button label={t("settings.saveProfile")} onPress={() => void handleSaveProfile()} />
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tune-variant" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("settings.preferences")}</Text>
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.themeLabel")}</Text>
        <View style={styles.row}>
          <Chip label={t("settings.theme.light")} selected={theme === "light"} onPress={() => setTheme("light")} />
          <Chip label={t("settings.theme.dark")} selected={theme === "dark"} onPress={() => setTheme("dark")} />
          <Chip label={t("settings.theme.system")} selected={theme === "system"} onPress={() => setTheme("system")} />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.language")}</Text>
        <View style={styles.row}>
          <Chip label="PT-BR" selected={language === "pt-BR"} onPress={() => setLanguage("pt-BR")} />
          <Chip label="EN" selected={language === "en"} onPress={() => setLanguage("en")} />
          <Chip label="ES" selected={language === "es"} onPress={() => setLanguage("es")} />
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("settings.reminderTitle")}</Text>
        </View>
        <Text style={{ color: colors.textMuted }}>{t("settings.reminderHint")}</Text>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.reminderTimeLabel")}</Text>
        <Input
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder={t("settings.reminderTimePlaceholder")}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("settings.reminderDaysLabel")}</Text>
        <View style={styles.row}>
          {weekLabels.map((label, index) => {
            const weekday = index as Weekday;
            return (
              <Chip
                key={`${label}-${weekday}`}
                label={label}
                selected={reminderWeekdays.includes(weekday)}
                onPress={() => toggleReminderWeekday(weekday)}
              />
            );
          })}
        </View>
        <View style={styles.row}>
          <Chip label={t("settings.reminderToggleOn")} selected={reminderEnabled} onPress={() => setReminderEnabled(true)} />
          <Chip label={t("settings.reminderToggleOff")} selected={!reminderEnabled} onPress={() => setReminderEnabled(false)} />
        </View>
        <Button label={t("settings.reminderSave")} onPress={() => void handleSaveReminder()} />
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("settings.cloudSync")}</Text>
        </View>
        <Text style={{ color: colors.textMuted }}>{t("settings.cloudHint")}</Text>
        <View style={styles.row}>
          <Button label={t("settings.backupNow")} onPress={() => void handleBackup()} />
          <Button label={t("settings.restoreNow")} variant="outline" onPress={() => void handleRestore()} />
        </View>
      </Card>

      {message ? (
        <Card variant="muted">
          <Text style={{ color: colors.text }}>{message}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function parseReminderTime(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

function formatReminderTime(hour: number, minute: number) {
  const hh = String(Math.max(0, Math.min(23, Math.floor(hour)))).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, Math.floor(minute)))).padStart(2, "0");
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 110,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  accountCard: {
    gap: 12
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700"
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  loginBlock: {
    gap: 8
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  col: {
    flex: 1,
    minWidth: 140
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700"
  }
});
