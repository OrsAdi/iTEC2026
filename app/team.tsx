import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";

interface Team {
  id: string;
  name: string;
  code: string;
  created_by: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeamScreen() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) return;
      setCurrentUserId(userId);

      // Caută dacă userul e în vreo echipă
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .single();

      if (!membership) {
        setTeam(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      // Încarcă echipa
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", membership.team_id)
        .single();

      if (teamData) setTeam(teamData);

      // Încarcă membrii
      const { data: membersData } = await supabase
        .from("team_members")
        .select(`
          id,
          user_id,
          joined_at,
          profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq("team_id", membership.team_id);

      if (membersData) setMembers(membersData as any);
    } catch (e) {
      console.log("Team load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert("EROARE", "Introdu un nume pentru echipă.");
      return;
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) return;

      const code = generateCode();

      const { data: newTeam, error } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), code, created_by: userId })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("team_members")
        .insert({ team_id: newTeam.id, user_id: userId });

      setCreateModal(false);
      setTeamName("");
      await loadTeam();
    } catch (e: any) {
      Alert.alert("EROARE", e.message);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      Alert.alert("EROARE", "Introdu codul echipei.");
      return;
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) return;

      // Caută echipa după cod
      const { data: foundTeam, error } = await supabase
        .from("teams")
        .select("*")
        .eq("code", joinCode.trim().toUpperCase())
        .single();

      if (error || !foundTeam) {
        Alert.alert("EROARE", "Codul echipei nu există.");
        return;
      }

      // Verifică dacă e deja membru
      const { data: existing } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", foundTeam.id)
        .eq("user_id", userId)
        .single();

      if (existing) {
        Alert.alert("INFO", "Ești deja în această echipă.");
        return;
      }

      await supabase
        .from("team_members")
        .insert({ team_id: foundTeam.id, user_id: userId });

      setJoinModal(false);
      setJoinCode("");
      await loadTeam();
    } catch (e: any) {
      Alert.alert("EROARE", e.message);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId || !team) return;

      await supabase
        .from("team_members")
        .delete()
        .eq("team_id", team.id)
        .eq("user_id", userId);

      setLeaveModal(false);
      setTeam(null);
      setMembers([]);
    } catch (e: any) {
      Alert.alert("EROARE", e.message);
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
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {team ? (
              <>
                {/* Team card */}
                <BlurView intensity={60} tint="dark" style={styles.teamCard}>
                  <View style={styles.teamCardHeader}>
                    <View style={styles.teamIconCircle}>
                      <Ionicons name="people" size={28} color="#007AFF" />
                    </View>
                    <View style={styles.teamCardInfo}>
                      <Text style={styles.teamName}>{team.name}</Text>
                      <Text style={styles.teamMemberCount}>
                        {members.length} {members.length === 1 ? "membru" : "membri"}
                      </Text>
                    </View>
                  </View>

                  {/* Cod invitație */}
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>COD INVITAȚIE</Text>
                    <Text style={styles.codeValue}>{team.code}</Text>
                    <Text style={styles.codeHint}>
                      Trimite codul prietenilor să se alăture echipei
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.leaveBtn}
                    onPress={() => setLeaveModal(true)}
                  >
                    <Ionicons name="exit-outline" size={16} color="#ef4444" />
                    <Text style={styles.leaveBtnText}>PĂRĂSEȘTE ECHIPA</Text>
                  </TouchableOpacity>
                </BlurView>

                {/* Members */}
                <BlurView intensity={60} tint="dark" style={styles.listCard}>
                  <Text style={styles.listTitle}>MEMBERS_LIST</Text>
                  {members.map((member, index) => (
                    <View key={member.id}>
                      <View style={styles.memberRow}>
                        <View style={[
                          styles.memberAvatar,
                          member.user_id === currentUserId && styles.memberAvatarSelf,
                        ]}>
                          <Ionicons
                            name="person"
                            size={20}
                            color={member.user_id === currentUserId ? "#007AFF" : "#555"}
                          />
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberEmail} numberOfLines={1}>
                              {(member.profiles as any)?.full_name ||
                               (member.profiles as any)?.email ||
                               "Unknown"}
                            </Text>
                            {member.user_id === currentUserId && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>YOU</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.memberDate}>
                            Joined {new Date(member.joined_at).toLocaleDateString("ro-RO")}
                          </Text>
                        </View>
                        <View style={styles.statusDot} />
                      </View>
                      {index < members.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </BlurView>
              </>
            ) : (
              <>
                {/* No team */}
                <BlurView intensity={60} tint="dark" style={styles.noTeamCard}>
                  <Text style={styles.noTeamIcon}>👥</Text>
                  <Text style={styles.noTeamTitle}>NO_TEAM_FOUND</Text>
                  <Text style={styles.noTeamSubtitle}>
                    Creează o echipă nouă sau alătură-te uneia existente cu un cod de invitație.
                  </Text>
                </BlurView>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setCreateModal(true)}
                >
                  <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                    <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                    <Text style={styles.actionButtonText}>CREEAZĂ ECHIPĂ</Text>
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { marginTop: 12 }]}
                  onPress={() => setJoinModal(true)}
                >
                  <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                    <Ionicons name="enter-outline" size={22} color="#007AFF" />
                    <Text style={styles.actionButtonText}>ALĂTURĂ-TE CU COD</Text>
                  </BlurView>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
          </ScrollView>
        )}

        <BottomNav activeTab="team" />
      </View>

      {/* Modal Creare Echipă */}
      <Modal visible={createModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderMain}>CREATE</Text>
              <Text style={styles.modalHeaderSub}> TEAM</Text>
            </View>
            <View style={styles.successIconCircle}>
              <Ionicons name="people" size={24} color="#007AFF" />
            </View>
            <Text style={styles.modalTitle}>NUME ECHIPĂ</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: GLITCH_SQUAD"
              placeholderTextColor="#555"
              value={teamName}
              onChangeText={setTeamName}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setCreateModal(false); setTeamName(""); }}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateTeam}>
                <Text style={styles.modalConfirmText}>CREATE</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Modal Join Echipă */}
      <Modal visible={joinModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderMain}>JOIN</Text>
              <Text style={styles.modalHeaderSub}> TEAM</Text>
            </View>
            <View style={styles.successIconCircle}>
              <Ionicons name="enter" size={24} color="#007AFF" />
            </View>
            <Text style={styles.modalTitle}>COD INVITAȚIE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: ABC123"
              placeholderTextColor="#555"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setJoinModal(false); setJoinCode(""); }}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleJoinTeam}>
                <Text style={styles.modalConfirmText}>JOIN</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Modal Leave */}
      <Modal visible={leaveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderMain}>LEAVE</Text>
              <Text style={styles.modalHeaderSub}> TEAM</Text>
            </View>
            <View style={[styles.successIconCircle, { borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }]}>
              <Ionicons name="exit" size={24} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>CONFIRMI?</Text>
            <Text style={styles.modalMessage}>
              Vrei să părăsești echipa "{team?.name}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLeaveModal(false)}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: "#ef4444" }]}
                onPress={handleLeaveTeam}
              >
                <Text style={styles.modalConfirmText}>LEAVE</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
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

  // Team card
  teamCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  teamCardHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  teamIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 2, borderColor: "#007AFF",
    alignItems: "center", justifyContent: "center",
  },
  teamCardInfo: { flex: 1 },
  teamName: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  teamMemberCount: { color: "#555", fontSize: 12, marginTop: 2 },

  // Code box
  codeBox: {
    backgroundColor: "rgba(0,122,255,0.08)",
    borderRadius: 14, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    marginBottom: 16,
  },
  codeLabel: { color: "#555", fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  codeValue: {
    color: "#007AFF", fontSize: 32, fontWeight: "bold",
    letterSpacing: 8, marginBottom: 8,
  },
  codeHint: { color: "#444", fontSize: 11, textAlign: "center" },

  leaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  leaveBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "bold", letterSpacing: 1 },

  // Members list
  listCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  listTitle: { color: "#007AFF", fontSize: 11, fontWeight: "bold", letterSpacing: 2, marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  memberAvatarSelf: { backgroundColor: "rgba(0,122,255,0.1)", borderColor: "#007AFF" },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  memberEmail: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  memberDate: { color: "#555", fontSize: 11 },
  youBadge: {
    backgroundColor: "rgba(0,122,255,0.2)",
    borderWidth: 1, borderColor: "#007AFF",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
  youBadgeText: { color: "#007AFF", fontSize: 9, fontWeight: "bold", letterSpacing: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00FF78" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  // No team
  noTeamCard: {
    borderRadius: 20, padding: 32, alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  noTeamIcon: { fontSize: 48, marginBottom: 12 },
  noTeamTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 2, marginBottom: 8 },
  noTeamSubtitle: { color: "#555", fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Action buttons
  actionButton: {
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.3)",
  },
  actionButtonInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, gap: 10, backgroundColor: "rgba(0,122,255,0.08)",
  },
  actionButtonText: { color: "#007AFF", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },

  version: { color: "#333", fontSize: 10, textAlign: "center", letterSpacing: 1, marginTop: 16 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center", alignItems: "center",
  },
  modalCard: {
    width: "85%", borderRadius: 25, padding: 30, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.4)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalHeader: { flexDirection: "row", marginBottom: 20 },
  modalHeaderMain: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  modalHeaderSub: { color: "#007AFF", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  successIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(0,122,255,0.1)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16, borderWidth: 1, borderColor: "#007AFF",
  },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 2, marginBottom: 12 },
  modalMessage: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", marginBottom: 20 },
  modalInput: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.3)",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: "#fff", fontSize: 18, fontWeight: "bold",
    letterSpacing: 4, textAlign: "center", marginBottom: 20,
  },
  modalActions: { width: "100%", flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalCancelText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  modalConfirmBtn: {
    flex: 1, backgroundColor: "#007AFF",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
});