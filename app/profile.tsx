import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";
import { getAllPosters } from "./lib/storage";
import { supabase } from "./lib/supabase";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posterCount, setPosterCount] = useState(0);
  const [annotatedCount, setAnnotatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.session.user.id)
        .single();
      if (!error && data) setProfile(data);
    } catch (e) {
      console.log("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const posters = await getAllPosters();
    setPosterCount(posters.length);
    setAnnotatedCount(
      posters.filter((p) => p.drawingData !== "[]" && p.drawingData !== "").length
    );
  };

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextMain}>GLITCH_</Text>
            <Text style={styles.logoTextSub}>TAG</Text>
          </View>
          <Text style={styles.headerSub}>MY_PROFILE</Text>
        </BlurView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <BlurView intensity={60} tint="dark" style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color="#007AFF" />
            </View>
            <Text style={styles.emailText}>{profile?.email ?? "—"}</Text>
            <Text style={styles.joinedText}>
              Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ro-RO") : "—"}
            </Text>
          </BlurView>

          {/* Stats */}
          <View style={styles.statsRow}>
            <BlurView intensity={60} tint="dark" style={styles.statCard}>
              <Text style={styles.statNumber}>{posterCount}</Text>
              <Text style={styles.statLabel}>AFIȘE{"\n"}SCANATE</Text>
            </BlurView>
            <BlurView intensity={60} tint="dark" style={styles.statCard}>
              <Text style={styles.statNumber}>{annotatedCount}</Text>
              <Text style={styles.statLabel}>AFIȘE{"\n"}ADNOTATE</Text>
            </BlurView>
            <BlurView intensity={60} tint="dark" style={styles.statCard}>
              <Text style={styles.statNumber}>
                {posterCount > 0 ? Math.round((annotatedCount / posterCount) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>RATA{"\n"}ADNOTARE</Text>
            </BlurView>
          </View>

          {/* Info */}
          <BlurView intensity={60} tint="dark" style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>ACCOUNT_INFO</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#007AFF" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={styles.infoValue}>{profile?.email ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="finger-print-outline" size={18} color="#007AFF" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>USER ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {profile?.id?.slice(0, 16) ?? "—"}...
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>MEMBER SINCE</Text>
                <Text style={styles.infoValue}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ro-RO") : "—"}
                </Text>
              </View>
            </View>
          </BlurView>

          {/* Actions */}
          <BlurView intensity={60} tint="dark" style={styles.actionsCard}>
            <Text style={styles.infoCardTitle}>QUICK_ACTIONS</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/feed")}>
              <Ionicons name="images-outline" size={20} color="#007AFF" />
              <Text style={styles.actionBtnText}>Vezi Feed-ul</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/scan")}>
              <Ionicons name="camera-outline" size={20} color="#007AFF" />
              <Text style={styles.actionBtnText}>Scanează Afiș</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/team")}>
              <Ionicons name="people-outline" size={20} color="#007AFF" />
              <Text style={styles.actionBtnText}>Vezi Echipa</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </BlurView>

          <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
        </ScrollView>

        <BottomNav activeTab="profile" />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingTop: 55, paddingBottom: 15, paddingHorizontal: 25,
    borderBottomWidth: 1, borderBottomColor: "rgba(0,122,255,0.3)",
    alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)",
  },
  logoBox: {
    flexDirection: "row", backgroundColor: "rgba(0,122,255,0.1)",
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: "#007AFF", marginBottom: 4,
  },
  logoTextMain: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  logoTextSub: { color: "#007AFF", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "#555", fontSize: 11, letterSpacing: 3, marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  avatarCard: {
    borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 2, borderColor: "#007AFF",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emailText: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  joinedText: { color: "#555", fontSize: 12, letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  statNumber: { color: "#007AFF", fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  statLabel: { color: "#555", fontSize: 9, letterSpacing: 1, textAlign: "center", lineHeight: 14 },
  infoCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  infoCardTitle: { color: "#007AFF", fontSize: 11, fontWeight: "bold", letterSpacing: 2, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  infoTextWrapper: { flex: 1 },
  infoLabel: { color: "#555", fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  infoValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  actionsCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  actionBtnText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  version: { color: "#333", fontSize: 10, textAlign: "center", letterSpacing: 1, marginTop: 8 },
});