import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";

interface TeamEntry {
    id: string;
    name: string;
    code: string;
    createdAt: number;
    members: string[];
}

const TEAM_INDEX_KEY = "team_index";
const TEAM_PREFIX = "team:";
const ACTIVE_TEAM_KEY = "active_team";
const LOCAL_MEMBER = "YOU";

async function getTeamIndex(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(TEAM_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function setTeamIndex(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(TEAM_INDEX_KEY, JSON.stringify(ids));
}

async function saveTeam(team: TeamEntry): Promise<void> {
    const ids = await getTeamIndex();
    if (!ids.includes(team.id)) {
        ids.push(team.id);
        await setTeamIndex(ids);
    }
    await AsyncStorage.setItem(TEAM_PREFIX + team.id, JSON.stringify(team));
}

async function getTeam(id: string): Promise<TeamEntry | null> {
    const raw = await AsyncStorage.getItem(TEAM_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
}

async function getAllTeams(): Promise<TeamEntry[]> {
    const ids = await getTeamIndex();
    const teams = await Promise.all(ids.map((id) => getTeam(id)));
    return (teams.filter(Boolean) as TeamEntry[]).sort((a, b) => b.createdAt - a.createdAt);
}

function normalizeCode(code: string): string {
    return code.replace(/\s+/g, "").toUpperCase();
}

function generateTeamCode(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateTeamId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function TeamScreen() {
    const [teamName, setTeamName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [teams, setTeams] = useState<TeamEntry[]>([]);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [allTeams, active] = await Promise.all([
            getAllTeams(),
            AsyncStorage.getItem(ACTIVE_TEAM_KEY),
        ]);
        setTeams(allTeams);
        setActiveTeamId(active);
    };

    const activeTeam = useMemo(
        () => teams.find((t) => t.id === activeTeamId) ?? null,
        [teams, activeTeamId]
    );

    const createTeam = async () => {
        const safeName = teamName.trim();
        if (safeName.length < 3) {
            Alert.alert("TEAM_ERROR", "Team name must contain at least 3 characters.");
            return;
        }

        const existingCodes = new Set(teams.map((t) => t.code));
        let code = generateTeamCode();
        while (existingCodes.has(code)) code = generateTeamCode();

        const team: TeamEntry = {
            id: generateTeamId(),
            name: safeName,
            code,
            createdAt: Date.now(),
            members: [LOCAL_MEMBER],
        };

        await saveTeam(team);
        await AsyncStorage.setItem(ACTIVE_TEAM_KEY, team.id);
        setTeamName("");
        await loadData();
    };

    const joinTeamByCode = async () => {
        const targetCode = normalizeCode(joinCode);
        if (!targetCode) {
            Alert.alert("TEAM_ERROR", "Enter a valid invite code.");
            return;
        }

        const found = teams.find((t) => t.code === targetCode);
        if (!found) {
            Alert.alert("TEAM_NOT_FOUND", "No team was found for this code.");
            return;
        }

        if (!found.members.includes(LOCAL_MEMBER)) {
            await saveTeam({ ...found, members: [...found.members, LOCAL_MEMBER] });
        }

        await AsyncStorage.setItem(ACTIVE_TEAM_KEY, found.id);
        setJoinCode("");
        await loadData();
    };

    const quickJoin = async (team: TeamEntry) => {
        if (!team.members.includes(LOCAL_MEMBER)) {
            await saveTeam({ ...team, members: [...team.members, LOCAL_MEMBER] });
        }
        await AsyncStorage.setItem(ACTIVE_TEAM_KEY, team.id);
        await loadData();
    };

    const leaveTeam = async () => {
        if (!activeTeam) return;
        const nextMembers = activeTeam.members.filter((m) => m !== LOCAL_MEMBER);
        await saveTeam({ ...activeTeam, members: nextMembers });
        await AsyncStorage.removeItem(ACTIVE_TEAM_KEY);
        await loadData();
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

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={60} tint="dark" style={styles.statsCard}>
                        <View style={styles.statRow}>
                            <Ionicons name="people" size={28} color="#007AFF" />
                            <View style={styles.statTextWrapper}>
                                <Text style={styles.statNumber}>{teams.length}</Text>
                                <Text style={styles.statLabel}>ECHIPE DISPONIBILE</Text>
                            </View>
                        </View>
                    </BlurView>

                    <BlurView intensity={60} tint="dark" style={styles.listCard}>
                        <Text style={styles.listTitle}>ACTIVE_TEAM</Text>
                        {activeTeam ? (
                            <>
                                <Text style={styles.activeTeamName}>{activeTeam.name}</Text>
                                <Text style={styles.activeTeamMeta}>INVITE CODE: {activeTeam.code}</Text>
                                <Text style={styles.activeTeamMeta}>MEMBERS: {activeTeam.members.length}</Text>
                                <TouchableOpacity style={styles.leaveBtn} onPress={leaveTeam}>
                                    <Text style={styles.leaveBtnText}>LEAVE TEAM</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={styles.emptyText}>Nu ai o echipă activă.</Text>
                        )}
                    </BlurView>

                    <BlurView intensity={60} tint="dark" style={styles.listCard}>
                        <Text style={styles.listTitle}>CREATE_TEAM</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Team name"
                            placeholderTextColor="#5e6a77"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                        <TouchableOpacity style={styles.actionBtn} onPress={createTeam}>
                            <Text style={styles.actionBtnText}>CREATE + ACTIVATE</Text>
                        </TouchableOpacity>
                    </BlurView>

                    <BlurView intensity={60} tint="dark" style={styles.listCard}>
                        <Text style={styles.listTitle}>JOIN_TEAM</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Invite code"
                            placeholderTextColor="#5e6a77"
                            autoCapitalize="characters"
                            maxLength={6}
                            value={joinCode}
                            onChangeText={(text) => setJoinCode(normalizeCode(text))}
                        />
                        <TouchableOpacity style={styles.actionBtn} onPress={joinTeamByCode}>
                            <Text style={styles.actionBtnText}>JOIN BY CODE</Text>
                        </TouchableOpacity>

                        <Text style={styles.listSubtitle}>AVAILABLE</Text>
                        {teams.length === 0 ? (
                            <Text style={styles.emptyText}>Nu există echipe create încă.</Text>
                        ) : (
                            teams.map((team, index) => (
                                <View key={team.id}>
                                    <TouchableOpacity style={styles.memberRow} onPress={() => quickJoin(team)}>
                                        <View style={styles.memberAvatar}>
                                            <Ionicons name="people" size={18} color="#007AFF" />
                                        </View>
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberEmail} numberOfLines={1}>
                                                {team.name}
                                            </Text>
                                            <Text style={styles.memberDate}>
                                                CODE {team.code} | MEMBERS {team.members.length}
                                            </Text>
                                        </View>
                                        <Text style={styles.joinText}>JOIN</Text>
                                    </TouchableOpacity>
                                    {index < teams.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))
                        )}
                    </BlurView>

                    <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
                </ScrollView>

                <BottomNav activeTab="team" />
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    emptyText: { color: "#555", fontSize: 13 },
    listSubtitle: {
        color: "#4f5d6a",
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 14,
    },
    activeTeamName: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 8,
    },
    activeTeamMeta: {
        color: "#8791a0",
        fontSize: 12,
        marginBottom: 3,
    },
    input: {
        width: "100%",
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.04)",
        color: "#fff",
        paddingHorizontal: 14,
        fontSize: 16,
        marginBottom: 12,
    },
    actionBtn: {
        minHeight: 54,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#007AFF",
    },
    actionBtnText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 1,
    },
    leaveBtn: {
        marginTop: 12,
        minHeight: 52,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ef4444",
    },
    leaveBtnText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 13,
        letterSpacing: 1,
    },

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
    memberInfo: { flex: 1 },
    memberEmail: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
    memberDate: { color: "#555", fontSize: 11 },
    joinText: { color: "#007AFF", fontWeight: "800", fontSize: 12, letterSpacing: 1 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
    version: {
        color: "#333", fontSize: 10, textAlign: "center",
        letterSpacing: 1, marginTop: 8,
    },
});