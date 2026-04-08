import { AuthUser, CloudUserProfile, SignUpInput } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

const PROFILE_TABLE = "user_profiles";

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao configurado no app.json");
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
        age: input.age,
        height_cm: input.heightCm,
        weight_kg: input.weightKg
      }
    }
  });

  if (error) {
    throw error;
  }

  if (data.user && data.session) {
    await upsertUserProfile(data.user.id, {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg
    });
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao configurado no app.json");
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.email) {
    throw error ?? new Error("Falha no login.");
  }
  return { id: data.user.id, email: data.user.email };
}

export async function signOutCloud() {
  if (!isSupabaseConfigured) {
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao configurado no app.json");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) {
    throw error;
  }
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const sessionResponse = await supabase.auth.getSession();
  const sessionUser = sessionResponse.data.session?.user;
  if (sessionUser?.email) {
    return { id: sessionUser.id, email: sessionUser.email };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) {
    return null;
  }
  return { id: data.user.id, email: data.user.email };
}

export async function upsertUserProfile(
  userId: string,
  data: Omit<CloudUserProfile, "id" | "updatedAtIso">
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao configurado no app.json");
  }

  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    {
      id: userId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      age: data.age,
      height_cm: data.heightCm,
      weight_kg: data.weightKg,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<CloudUserProfile | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, full_name, email, phone, age, height_cm, weight_kg, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    fullName: data.full_name as string,
    email: data.email as string,
    phone: data.phone as string,
    age: Number(data.age),
    heightCm: Number(data.height_cm),
    weightKg: Number(data.weight_kg),
    updatedAtIso: data.updated_at as string
  };
}
