import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASEURL ??
  "https://placeholder.supabase.co";

const supabasepub =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUB ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  "placeholder-anon-key";

const usingPlaceholderConfig =
  supabaseUrl === "https://placeholder.supabase.co" ||
  supabasepub === "placeholder-anon-key";

if (usingPlaceholderConfig) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env. Running with placeholder config."
  );
}

export const supabase = createClient(supabaseUrl, supabasepub, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
