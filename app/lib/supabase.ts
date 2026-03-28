import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Copiază cheia lungă din screenshot-ul tău în locul ghilimelelor de mai jos:
const supabasepub = process.env.EXPO_PUBLIC_SUPABASE_PUB;

export const supabase = createClient(supabaseUrl, supabasepub, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
