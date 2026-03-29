import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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

interface MemberProfile {
    user_id: string;
    joined_at: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeamScreen() {
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);
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
            const userEmail = session.session?.user?.email ?? "";
            if (!userId) return;
            setCurrentUserId(userId);

            // Caută membership
            const { data: memberships } = await supabase
                .from("team_members")
                .select("team_id")
                .eq("user_id", userId);

            if (!memberships || memberships.length === 0) {
                setTeam(null);
                setMembers([]);
                setLoading(false);
                return;
            }

            const teamId = memberships[0].team_id;

            // Încarcă echipa
            const { data: teamData } = await supabase
                .from("teams")
                .select("*")
                .eq("id", teamId)
                .single();

            if (teamData) setTeam(teamData);

            // Încarcă membrii
            const { data: membersData } = await supabase
                .from("team_members")
                .select("user_id, joined_at")
                .eq("team_id", teamId);

            if (!membersData) { setLoading(false); return; }

            // Încarcă profilurile pentru fiecare membru
            const memberProfiles: MemberProfile[] = await Promise.all(
                membersData.map(async (m) => {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("email, full_name, avatar_url")
                        .eq("id", m.user_id)
                        .single();

                    // Dacă e userul curent, folosim emailul din sesiune
                    const email = m.user_id === userId
                        ? userEmail
                        : (profile?.email ?? `user_${m.user_id.slice(0, 6)}`);

                    return {
                        user_id: m.user_id,
                        joined_at: m.joined_at,
                        email,
                        full_name: profile?.full_name ?? null,
                        avatar_url: profile?.avatar_url ?? null,
                    };
                })
            );

            setMembers(memberProfiles);
        } catch (e) {
            console.log("Team load error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            Alert.alert("ERROR", "Enter a team name.");
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

            await supabase.from("team_members").insert({ team_id: newTeam.id, user_id: userId });

            setCreateModal(false);
            setTeamName("");
            await loadTeam();
        } catch (e: any) {
            Alert.alert("ERROR", e.message);
        }
    };

    const handleJoinTeam = async () => {
        if (!joinCode.trim()) {
            Alert.alert("ERROR", "Enter the team code.");
            return;
        }
        try {
            const { data: session } = await supabase.auth.getSession();
            const userId = session.session?.user?.id;
            if (!userId) return;

            const { data: foundTeam, error } = await supabase
                .from("teams")
                .select("*")
                .eq("code", joinCode.trim().toUpperCase())
                .single();

            if (error || !foundTeam) {
                Alert.alert("ERROR", "Team code does not exist.");
                return;
            }

            const { data: existing } = await supabase
                .from("team_members")
                .select("id")
                .eq("team_id", foundTeam.id)
                .eq("user_id", userId);

            if (existing && existing.length > 0) {
                Alert.alert("INFO", "You are already in this team.");
                return;
            }

            await supabase.from("team_members").insert({ team_id: foundTeam.id, user_id: userId });

            setJoinModal(false);
            setJoinCode("");
            await loadTeam();
        } catch (e: any) {
            Alert.alert("ERROR", e.message);
        }
    };

    const handleLeaveTeam = async () => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const userId = session.session?.user?.id;
            if (!userId || !team) return;

            await supabase.from("team_members").delete()
                .eq("team_id", team.id).eq("user_id", userId);

            setLeaveModal(false);
            setTeam(null);
            setMembers([]);
        } catch (e: any) {
            Alert.alert("ERROR", e.message);
        }
    };

    return (
        <AppBackground>
            <View style={styles.container}>
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
                                                {members.length} {members.length === 1 ? "member" : "members"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.codeBox}>
                                        <Text style={styles.codeLabel}>INVITE CODE</Text>
                                        <Text style={styles.codeValue}>{team.code}</Text>
                                        <Text style={styles.codeHint}>
                                            Send this code to friends so they can join the team
                                        </Text>
                                    </View>

                                    <TouchableOpacity style={styles.leaveBtn} onPress={() => setLeaveModal(true)}>
                                        <Ionicons name="exit-outline" size={16} color="#ef4444" />
                                        <Text style={styles.leaveBtnText}>LEAVE TEAM</Text>
                                    </TouchableOpacity>
                                </BlurView>

                                {/* Members */}
                                <BlurView intensity={60} tint="dark" style={styles.listCard}>
                                    <Text style={styles.listTitle}>
                                        MEMBERS_LIST ({members.length})
                                    </Text>
                                    {members.map((member, index) => {
                                        const isSelf = member.user_id === currentUserId;
                                        const displayName = member.full_name || member.email || `User ${member.user_id.slice(0, 6)}`;

                                        return (
                                            <View key={member.user_id}>
                                                <View style={styles.memberRow}>
                                                    {/* Avatar */}
                                                    {member.avatar_url ? (
                                                        <Image
                                                            source={{ uri: member.avatar_url }}
                                                            style={[styles.memberAvatarImg, isSelf && styles.memberAvatarSelf]}
                                                        />
                                                    ) : (
                                                        <View style={[styles.memberAvatar, isSelf && styles.memberAvatarSelf]}>
                                                            <Ionicons name="person" size={20} color={isSelf ? "#007AFF" : "#555"} />
                                                        </View>
                                                    )}

                                                    {/* Info */}
                                                    <View style={styles.memberInfo}>
                                                        <View style={styles.memberNameRow}>
                                                            <Text style={styles.memberName} numberOfLines={1}>
                                                                {displayName}
                                                            </Text>
                                                            {isSelf && (
                                                                <View style={styles.youBadge}>
                                                                    <Text style={styles.youBadgeText}>YOU</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text style={styles.memberEmail} numberOfLines={1}>
                                                            {member.email}
                                                        </Text>
                                                        <Text style={styles.memberDate}>
                                                            Joined {new Date(member.joined_at).toLocaleDateString("en-US")}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.statusDot} />
                                                </View>
                                                {index < members.length - 1 && <View style={styles.divider} />}
                                            </View>
                                        );
                                    })}
                                </BlurView>
                            </>
                        ) : (
                            <>
                                <BlurView intensity={60} tint="dark" style={styles.noTeamCard}>
                                    <Text style={styles.noTeamIcon}>👥</Text>
                                    <Text style={styles.noTeamTitle}>NO_TEAM_FOUND</Text>
                                    <Text style={styles.noTeamSubtitle}>
                                        Create a new team or join an existing one with an invite code.
                                    </Text>
                                </BlurView>

                                <TouchableOpacity style={styles.actionButton} onPress={() => setCreateModal(true)}>
                                    <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                                        <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                                        <Text style={styles.actionButtonText}>CREATE TEAM</Text>
                                    </BlurView>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => setJoinModal(true)}>
                                    <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                                        <Ionicons name="enter-outline" size={22} color="#007AFF" />
                                        <Text style={styles.actionButtonText}>JOIN WITH CODE</Text>
                                    </BlurView>
                                </TouchableOpacity>
                            </>
                        )}

                        <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
                    </ScrollView>
                )}

                <BottomNav activeTab="team" />
            </View>

            {/* Modal Creare */}
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
                        <Text style={styles.modalTitle}>TEAM NAME</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: GLITCH_SQUAD"
                            placeholderTextColor="#555"
                            value={teamName}
                            onChangeText={setTeamName}
                            autoCapitalize="characters"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setCreateModal(false); setTeamName(""); }}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateTeam}>
                                <Text style={styles.modalConfirmText}>CREATE</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* Modal Join */}
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
                        <Text style={styles.modalTitle}>INVITE CODE</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: ABC123"
                            placeholderTextColor="#555"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="characters"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setJoinModal(false); setJoinCode(""); }}>
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
                        <Text style={styles.modalMessage}>Do you want to leave team "{team?.name}"?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLeaveModal(false)}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: "#ef4444" }]} onPress={handleLeaveTeam}>
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
    codeBox: {
        backgroundColor: "rgba(0,122,255,0.08)",
        borderRadius: 14, padding: 16, alignItems: "center",
        borderWidth: 1, borderColor: "rgba(0,122,255,0.2)", marginBottom: 16,
    },
    codeLabel: { color: "#555", fontSize: 10, letterSpacing: 2, marginBottom: 8 },
    codeValue: { color: "#007AFF", fontSize: 32, fontWeight: "bold", letterSpacing: 8, marginBottom: 8 },
    codeHint: { color: "#444", fontSize: 11, textAlign: "center" },
    leaveBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 10,
        backgroundColor: "rgba(239,68,68,0.08)",
        borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    },
    leaveBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
    listCard: {
        borderRadius: 20, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
        overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
    },
    listTitle: { color: "#007AFF", fontSize: 11, fontWeight: "bold", letterSpacing: 2, marginBottom: 16 },
    memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
    memberAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
        alignItems: "center", justifyContent: "center",
    },
    memberAvatarImg: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    },
    memberAvatarSelf: { borderColor: "#007AFF", borderWidth: 2 },
    memberInfo: { flex: 1 },
    memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    memberName: { color: "#fff", fontSize: 13, fontWeight: "700", flex: 1 },
    memberEmail: { color: "#555", fontSize: 11, marginBottom: 2 },
    memberDate: { color: "#444", fontSize: 10 },
    youBadge: {
        backgroundColor: "rgba(0,122,255,0.2)",
        borderWidth: 1, borderColor: "#007AFF",
        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
    },
    youBadgeText: { color: "#007AFF", fontSize: 9, fontWeight: "bold", letterSpacing: 1 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00FF78" },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
    noTeamCard: {
        borderRadius: 20, padding: 32, alignItems: "center", marginBottom: 16,
        borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
        overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
    },
    noTeamIcon: { fontSize: 48, marginBottom: 12 },
    noTeamTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 2, marginBottom: 8 },
    noTeamSubtitle: { color: "#555", fontSize: 13, textAlign: "center", lineHeight: 20 },
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