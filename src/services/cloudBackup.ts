import { CloudBackupPayload } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

const TABLE_NAME = "user_backups";

export async function pushBackup(userId: string, payload: CloudBackupPayload) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao configurado.");
  }

  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      user_id: userId,
      payload,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function pullBackup(userId: string): Promise<CloudBackupPayload | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.from(TABLE_NAME).select("payload").eq("user_id", userId).single();
  if (error || !data?.payload) {
    return null;
  }

  return data.payload as CloudBackupPayload;
}

