import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://kgqgiprdojdqjjniyiwm.supabase.co";
// Copiază cheia lungă din screenshot-ul tău în locul ghilimelelor de mai jos:
const supabaseAnonKey = "ssb_publishable_z7dcC5t-ERJ25hACfJ6u4Q_nKbD5IkB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
