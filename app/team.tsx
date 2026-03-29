import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";

interface TeamMember {
  id: string;
  email: string;
  created_at: string;
}

export default function TeamScreen() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      setCurrentUserId(session.session?.user?.id ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) setMembers(data);
    } catch (e) {
      console.log("Team load error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextMain}>GLITCH_</Text>
            <Text style={styles.logoTextSub}>TAG</Text>
          </View>
          <Text style={styles.headerSub}>TEAM_NETWORK</Text>
        </BlurView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats */}
            <BlurView intensity={60} tint="dark" style={styles.statsCard}>
              <View style={styles.statRow}>
                <Ionicons name="people" size={28} color="#007AFF" />
                <View style={styles.statTextWrapper}>
                  <Text style={styles.statNumber}>{members.length}</Text>
                  <Text style={styles.statLabel}>MEMBRI ÎN REȚEA</Text>
                </View>
              </View>
            </BlurView>

            {/* Members list */}
            <BlurView intensity={60} tint="dark" style={styles.listCard}>
              <Text style={styles.listTitle}>MEMBERS_LIST</Text>

              {members.length === 0 ? (
                <View style={styles.emptyWrapper}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyText}>Niciun membru găsit.</Text>
                </View>
              ) : (
                members.map((member, index) => (
                  <View key={member.id}>
                    <View style={styles.memberRow}>
                      {/* Avatar */}
                      <View style={[
                        styles.memberAvatar,
                        member.id === currentUserId && styles.memberAvatarSelf,
                      ]}>
                        <Ionicons
                          name="person"
                          size={20}
                          color={member.id === currentUserId ? "#007AFF" : "#555"}
                        />
                      </View>

                      {/* Info */}
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberEmail} numberOfLines={1}>
                            {member.email}
                          </Text>
                          {member.id === currentUserId && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberDate}>
                          Joined {new Date(member.created_at).toLocaleDateString("ro-RO")}
                        </Text>
                      </View>

                      {/* Status indicator */}
                      <View style={styles.statusDot} />
                    </View>

                    {index < members.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              )}
            </BlurView>

            <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
          </ScrollView>
        )}

        <BottomNav activeTab="team" />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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

  // Stats card
  statsCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  statTextWrapper: { flex: 1 },
  statNumber: { color: "#007AFF", fontSize: 32, fontWeight: "bold" },
  statLabel: { color: "#555", fontSize: 11, letterSpacing: 2, marginTop: 2 },

  // Members list
  listCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  listTitle: {
    color: "#007AFF", fontSize: 11, fontWeight: "bold",
    letterSpacing: 2, marginBottom: 16,
  },
  emptyWrapper: { alignItems: "center", paddingVertical: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: "#555", fontSize: 13 },

  // Member row
  memberRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, gap: 12,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  memberAvatarSelf: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderColor: "#007AFF",
  },
  memberInfo: { flex: 1 },
  memberNameRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3,
  },
  memberEmail: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  memberDate: { color: "#555", fontSize: 11 },
  youBadge: {
    backgroundColor: "rgba(0,122,255,0.2)",
    borderWidth: 1, borderColor: "#007AFF",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
  youBadgeText: { color: "#007AFF", fontSize: 9, fontWeight: "bold", letterSpacing: 1 },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#00FF78",
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  version: {
    color: "#333", fontSize: 10, textAlign: "center",
    letterSpacing: 1, marginTop: 8,
  },
});