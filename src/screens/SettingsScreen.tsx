import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
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
import { AppLanguage, AppTheme, FitnessGoal, Weekday } from "../types";

type SettingsNav = StackNavigationProp<RootStackParamList, "MainTabs">;

type SelectOption = {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type SelectSheetState = {
  title: string;
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
} | null;

type ReminderFrequencyPreset = "weekdays" | "everyday" | "weekends" | "custom";

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
  const [selectSheet, setSelectSheet] = useState<SelectSheetState>(null);

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

  const goalOptions = useMemo<SelectOption[]>(
    () => [
      { value: "lose", label: t("settings.goalLose"), icon: "trending-down" },
      { value: "gain", label: t("settings.goalGain"), icon: "trending-up" },
      { value: "maintain", label: t("settings.goalMaintain"), icon: "equal-box" }
    ],
    [t]
  );

  const themeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "light", label: t("settings.theme.light"), icon: "weather-sunny" },
      { value: "dark", label: t("settings.theme.dark"), icon: "weather-night" },
      { value: "system", label: t("settings.theme.system"), icon: "cellphone-cog" }
    ],
    [t]
  );

  const languageOptions = useMemo<SelectOption[]>(
    () => [
      { value: "pt-BR", label: t("settings.languagePtBr"), icon: "flag" },
      { value: "en", label: t("settings.languageEn"), icon: "flag-outline" },
      { value: "es", label: t("settings.languageEs"), icon: "flag-variant-outline" }
    ],
    [t]
  );

  const reminderFrequencyOptions = useMemo<SelectOption[]>(
    () => [
      { value: "weekdays", label: t("settings.frequencyWeekdays"), icon: "calendar-week" },
      { value: "everyday", label: t("settings.frequencyEveryday"), icon: "calendar-month" },
      { value: "weekends", label: t("settings.frequencyWeekends"), icon: "calendar-weekend" }
    ],
    [t]
  );

  const reminderFrequencyPreset = useMemo(
    () => resolveReminderFrequencyPreset(reminderWeekdays),
    [reminderWeekdays]
  );

  const reminderFrequencyLabel = useMemo(() => {
    if (reminderFrequencyPreset === "weekdays") {
      return t("settings.frequencyWeekdays");
    }
    if (reminderFrequencyPreset === "everyday") {
      return t("settings.frequencyEveryday");
    }
    if (reminderFrequencyPreset === "weekends") {
      return t("settings.frequencyWeekends");
    }
    return t("settings.frequencyCustom");
  }, [reminderFrequencyPreset, t]);

  const timeOptions = useMemo<SelectOption[]>(() => buildTimeOptions(), []);

  const goalLabel = useMemo(() => {
    if (goal === "lose") {
      return t("settings.goalLose");
    }
    if (goal === "gain") {
      return t("settings.goalGain");
    }
    return t("settings.goalMaintain");
  }, [goal, t]);

  const themeLabel = useMemo(() => {
    if (theme === "light") {
      return t("settings.theme.light");
    }
    if (theme === "dark") {
      return t("settings.theme.dark");
    }
    return t("settings.theme.system");
  }, [theme, t]);

  const languageLabel = useMemo(() => {
    if (language === "pt-BR") {
      return t("settings.languagePtBr");
    }
    if (language === "en") {
      return t("settings.languageEn");
    }
    return t("settings.languageEs");
  }, [language, t]);

  const openSelectSheet = (state: Exclude<SelectSheetState, null>) => {
    setSelectSheet(state);
  };

  const closeSelectSheet = () => {
    setSelectSheet(null);
  };

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
    const parsedAge = age.trim() === "" ? null : Number(age.trim());
    const parsedHeight = parseLocaleNumber(heightCm);
    const parsedWeight = parseLocaleNumber(weightKg);

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

  const persistReminderSettings = async (params: {
    enabled?: boolean;
    time?: string;
    weekdays?: Weekday[];
  }) => {
    const nextEnabled = params.enabled ?? reminderEnabled;
    const nextTime = params.time ?? reminderTime;
    const nextWeekdays = normalizeWeekdays(params.weekdays ?? reminderWeekdays);
    const parsed = parseReminderTime(nextTime);

    if (!parsed) {
      setMessage(t("settings.reminderInvalidTime"));
      return;
    }

    if (nextEnabled && nextWeekdays.length === 0) {
      setMessage(t("settings.reminderSelectDay"));
      return;
    }

    try {
      await updateWorkoutReminderSettings({
        enabled: nextEnabled,
        hour: parsed.hour,
        minute: parsed.minute,
        weekdays: nextWeekdays
      });
      setMessage(t("settings.reminderSaved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.backupError"));
    }
  };

  const handleToggleReminder = (enabled: boolean) => {
    setReminderEnabled(enabled);
    void persistReminderSettings({ enabled });
  };

  const handleSelectReminderTime = (value: string) => {
    setReminderTime(value);
    void persistReminderSettings({ time: value });
  };

  const handleSelectReminderFrequency = (value: string) => {
    if (value !== "weekdays" && value !== "everyday" && value !== "weekends") {
      return;
    }
    const weekdays = weekdaysFromPreset(value);
    setReminderWeekdays(weekdays);
    void persistReminderSettings({ weekdays });
  };

  const inputStyle = {
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontFamily: typography.body
  } as const;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
      >
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("settings.title")}</Text>

        <Card style={styles.accountCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySoft, borderColor: colors.primaryShadow }]}>
                <MaterialCommunityIcons name="account-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.accountTextWrap}>
                <Text style={[styles.accountName, { color: colors.text, fontFamily: typography.title }]}>
                  {displayName || t("settings.defaultName")}
                </Text>
                <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
                  {authUser?.email ?? t("settings.notLogged")}
                </Text>
              </View>
            </View>

            {authUser ? (
              <Pressable
                onPress={() => void handleSignOut()}
                style={[styles.logoutButton, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              >
                <MaterialCommunityIcons name="logout-variant" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {!authUser ? (
            <View style={[styles.loginBlock, { borderTopColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("settings.email")}</Text>
              <Input
                placeholder={t("settings.email")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.inputField, inputStyle]}
              />
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("settings.password")}</Text>
              <Input
                placeholder={t("settings.password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.inputField, inputStyle]}
              />
              <View style={styles.row}>
                <Button
                  label={t("settings.signin")}
                  onPress={() => void handleSignIn()}
                  style={styles.flex}
                  leftIcon={<MaterialCommunityIcons name="login" size={16} color="#FFFFFF" />}
                />
                <Button
                  label={t("settings.createAccount")}
                  variant="outline"
                  onPress={() => navigation.navigate("SignUp")}
                  style={styles.flex}
                />
              </View>
            </View>
          ) : null}
        </Card>

        <Card style={styles.sectionCard}>
          <SectionHeader
            icon="account-circle-outline"
            label={t("settings.personalData")}
            colors={{ text: colors.textMuted, icon: colors.textMuted }}
            typography={typography}
          />

          <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("settings.displayName")}</Text>
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("settings.displayName")}
            style={[styles.inputField, inputStyle]}
          />

          <View style={styles.metricRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("signup.age")}</Text>
              <Input value={age} onChangeText={setAge} keyboardType="numeric" placeholder={t("signup.age")} style={[styles.inputField, inputStyle]} />
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("signup.heightCm")}</Text>
              <Input
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                placeholder={t("signup.heightCm")}
                style={[styles.inputField, inputStyle]}
              />
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{t("signup.weightKg")}</Text>
              <Input
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder={t("signup.weightKg")}
                style={[styles.inputField, inputStyle]}
              />
            </View>
          </View>

          <SelectField
            label={t("settings.mainGoal")}
            value={goalLabel}
            onPress={() =>
              openSelectSheet({
                title: t("settings.mainGoal"),
                options: goalOptions,
                selectedValue: goal ?? "maintain",
                onSelect: (value) => {
                  void handleGoalSelect(value as FitnessGoal);
                }
              })
            }
            colors={{ text: colors.text, textMuted: colors.textMuted, border: colors.border, inputBg: colors.inputBg }}
            typography={typography}
          />

          <Button
            label={t("settings.saveProfile")}
            onPress={() => void handleSaveProfile()}
            style={styles.saveProfileButton}
            leftIcon={<MaterialCommunityIcons name="content-save-outline" size={16} color="#FFFFFF" />}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <SectionHeader
            icon="tune-variant"
            label={t("settings.preferences")}
            colors={{ text: colors.textMuted, icon: colors.textMuted }}
            typography={typography}
          />

          <View style={styles.preferenceRow}>
            <SelectField
              label={t("settings.appTheme")}
              value={themeLabel}
              onPress={() =>
                openSelectSheet({
                  title: t("settings.appTheme"),
                  options: themeOptions,
                  selectedValue: theme,
                  onSelect: (value) => setTheme(value as AppTheme)
                })
              }
              compact
              colors={{ text: colors.text, textMuted: colors.textMuted, border: colors.border, inputBg: colors.inputBg }}
              typography={typography}
            />
            <SelectField
              label={t("settings.language")}
              value={languageLabel}
              onPress={() =>
                openSelectSheet({
                  title: t("settings.language"),
                  options: languageOptions,
                  selectedValue: language,
                  onSelect: (value) => setLanguage(value as AppLanguage)
                })
              }
              compact
              colors={{ text: colors.text, textMuted: colors.textMuted, border: colors.border, inputBg: colors.inputBg }}
              typography={typography}
            />
          </View>

          <View style={[styles.reminderCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="bell-outline" size={18} color={colors.primary} />
                <Text style={[styles.reminderTitle, { color: colors.text, fontFamily: typography.title }]}>
                  {t("settings.trainingAlerts")}
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: "#CBD5E1", true: "#22C55E" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.reminderDivider, { backgroundColor: colors.border }]} />

            <View style={styles.preferenceRow}>
              <SelectField
                label={t("settings.reminderTimeLabel")}
                value={reminderTime}
                onPress={() =>
                  openSelectSheet({
                    title: t("settings.reminderTimeLabel"),
                    options: timeOptions,
                    selectedValue: reminderTime,
                    onSelect: handleSelectReminderTime
                  })
                }
                compact
                colors={{ text: colors.text, textMuted: colors.textMuted, border: colors.border, inputBg: colors.inputBg }}
                typography={typography}
              />
              <SelectField
                label={t("settings.reminderFrequencyLabel")}
                value={reminderFrequencyLabel}
                onPress={() =>
                  openSelectSheet({
                    title: t("settings.reminderFrequencyLabel"),
                    options: reminderFrequencyOptions,
                    selectedValue: reminderFrequencyPreset,
                    onSelect: handleSelectReminderFrequency
                  })
                }
                compact
                colors={{ text: colors.text, textMuted: colors.textMuted, border: colors.border, inputBg: colors.inputBg }}
                typography={typography}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <SectionHeader
            icon="cloud-outline"
            label={t("settings.cloudSync")}
            colors={{ text: colors.textMuted, icon: colors.textMuted }}
            typography={typography}
          />
          <Text style={[styles.cloudHint, { color: colors.textMuted, fontFamily: typography.body }]}>{t("settings.cloudHint")}</Text>
          <View style={styles.cloudActions}>
            <Button
              label={t("settings.backupNow")}
              onPress={() => void handleBackup()}
              style={styles.flex}
              leftIcon={<MaterialCommunityIcons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
            />
            <Button
              label={t("settings.restoreNow")}
              variant="outline"
              onPress={() => void handleRestore()}
              style={styles.flex}
              leftIcon={<MaterialCommunityIcons name="download" size={16} color={colors.textMuted} />}
            />
          </View>
        </Card>

        {message ? (
          <Card variant="muted">
            <Text style={{ color: colors.text, fontFamily: typography.body }}>{message}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(selectSheet)} transparent animationType="fade" onRequestClose={closeSelectSheet}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSelectSheet} />
          {selectSheet ? (
            <View style={[styles.sheetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: typography.title }]}>{selectSheet.title}</Text>
              {selectSheet.options.map((item) => {
                const selected = item.value === selectSheet.selectedValue;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      selectSheet.onSelect(item.value);
                      closeSelectSheet();
                    }}
                    style={[
                      styles.sheetOption,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primarySoft : colors.inputBg
                      }
                    ]}
                  >
                    <View style={styles.row}>
                      {item.icon ? (
                        <MaterialCommunityIcons name={item.icon} size={16} color={selected ? colors.primary : colors.textMuted} />
                      ) : null}
                      <Text style={{ color: colors.text, fontFamily: typography.body }}>{item.label}</Text>
                    </View>
                    {selected ? <MaterialCommunityIcons name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function SectionHeader({
  icon,
  label,
  colors,
  typography
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  colors: { text: string; icon: string };
  typography: ReturnType<typeof useTheme>["typography"];
}) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.icon} />
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function SelectField({
  label,
  value,
  onPress,
  compact = false,
  colors,
  typography
}: {
  label: string;
  value: string;
  onPress: () => void;
  compact?: boolean;
  colors: {
    text: string;
    textMuted: string;
    border: string;
    inputBg: string;
  };
  typography: ReturnType<typeof useTheme>["typography"];
}) {
  return (
    <View style={compact ? styles.preferenceCol : undefined}>
      <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.title }]}>{label}</Text>
      <Pressable style={[styles.selectTrigger, { borderColor: colors.border, backgroundColor: colors.inputBg }]} onPress={onPress}>
        <Text style={[styles.selectValue, { color: colors.text, fontFamily: typography.body }]} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
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

function parseLocaleNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function normalizeWeekdays(weekdays: Weekday[]) {
  return [...new Set(weekdays)].sort((a, b) => a - b) as Weekday[];
}

function resolveReminderFrequencyPreset(weekdays: Weekday[]): ReminderFrequencyPreset {
  const normalized = normalizeWeekdays(weekdays);
  if (isSameWeekdays(normalized, [1, 2, 3, 4, 5])) {
    return "weekdays";
  }
  if (isSameWeekdays(normalized, [0, 1, 2, 3, 4, 5, 6])) {
    return "everyday";
  }
  if (isSameWeekdays(normalized, [0, 6])) {
    return "weekends";
  }
  return "custom";
}

function weekdaysFromPreset(preset: Exclude<ReminderFrequencyPreset, "custom">): Weekday[] {
  if (preset === "weekdays") {
    return [1, 2, 3, 4, 5];
  }
  if (preset === "weekends") {
    return [0, 6];
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function isSameWeekdays(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function buildTimeOptions(): SelectOption[] {
  const options: SelectOption[] = [];
  for (let hour = 0; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({
        value: label,
        label,
        icon: "clock-outline"
      });
    }
  }
  return options;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 110,
    gap: 14
  },
  title: {
    fontSize: 24,
    fontWeight: "800"
  },
  accountCard: {
    gap: 12
  },
  accountTextWrap: {
    gap: 2
  },
  accountName: {
    fontSize: 22,
    fontWeight: "800"
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  loginBlock: {
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12
  },
  sectionCard: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  metricRow: {
    flexDirection: "row",
    gap: 10
  },
  metricCol: {
    flex: 1,
    gap: 6
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800"
  },
  inputField: {
    fontSize: 15,
    minHeight: 52
  },
  selectTrigger: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  selectValue: {
    fontSize: 15,
    flex: 1
  },
  saveProfileButton: {
    marginTop: 6,
    borderRadius: 16,
    minHeight: 54
  },
  preferenceRow: {
    flexDirection: "row",
    gap: 10
  },
  preferenceCol: {
    flex: 1,
    gap: 6
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "800"
  },
  reminderDivider: {
    height: 1
  },
  cloudHint: {
    fontSize: 13,
    lineHeight: 19
  },
  cloudActions: {
    flexDirection: "row",
    gap: 8
  },
  flex: {
    flex: 1
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)"
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6
  },
  sheetOption: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  }
});
