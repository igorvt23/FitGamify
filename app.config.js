const { expo } = require("./app.json");

module.exports = {
  ...expo,
  extra: {
    ...(expo.extra ?? {}),
    eas: {
      ...((expo.extra && expo.extra.eas) ?? {}),
      projectId: "3a7cc4b0-ba85-4c01-9210-764aa44016aa"
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""
  }
};
