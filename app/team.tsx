import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "./components/BottomNav";

type TeamEntry = {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  members: string[];
};

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
  return (teams.filter(Boolean) as TeamEntry[]).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
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
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const loadData = useCallback(async () => {
    const [allTeams, active] = await Promise.all([
      getAllTeams(),
      AsyncStorage.getItem(ACTIVE_TEAM_KEY),
    ]);
    setTeams(allTeams);
    setActiveTeamId(active);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) ?? null,
    [teams, activeTeamId],
  );

  const createTeam = useCallback(async () => {
    const safeName = teamName.trim();
    if (safeName.length < 3) {
      Alert.alert(
        "TEAM_ERROR",
        "Team name must contain at least 3 characters.",
      );
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
    setJoinCode("");
    await loadData();
    setSuccessModal({
      visible: true,
      title: "TEAM CREATED",
      message: `Team ${safeName} is now active. Invite code: ${code}`,
    });
  }, [teamName, teams, loadData]);

  const joinTeamByCode = useCallback(async () => {
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
    setSuccessModal({
      visible: true,
      title: "TEAM JOINED",
      message: `You joined ${found.name}.`,
    });
  }, [joinCode, teams, loadData]);

  const quickJoin = useCallback(
    async (team: TeamEntry) => {
      if (!team.members.includes(LOCAL_MEMBER)) {
        await saveTeam({ ...team, members: [...team.members, LOCAL_MEMBER] });
      }
      await AsyncStorage.setItem(ACTIVE_TEAM_KEY, team.id);
      await loadData();
      setSuccessModal({
        visible: true,
        title: "TEAM JOINED",
        message: `Active team switched to ${team.name}.`,
      });
    },
    [loadData],
  );

  const leaveTeam = useCallback(async () => {
    if (!activeTeam) return;
    Alert.alert("LEAVE_TEAM", `Leave ${activeTeam.name}?`, [
      { text: "CANCEL", style: "cancel" },
      {
        text: "LEAVE",
        style: "destructive",
        onPress: async () => {
          const nextMembers = activeTeam.members.filter(
            (m) => m !== LOCAL_MEMBER,
          );
          await saveTeam({ ...activeTeam, members: nextMembers });
          await AsyncStorage.removeItem(ACTIVE_TEAM_KEY);
          await loadData();
        },
      },
    ]);
  }, [activeTeam, loadData]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000",
        }}
        style={styles.background}
      >
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextMain}>GLITCH_</Text>
            <Text style={styles.logoTextSub}>TAG</Text>
          </View>
          <Text style={styles.headerSub}>TEAM_PORTAL</Text>
        </BlurView>

        <ScrollView contentContainerStyle={styles.content}>
          <BlurView intensity={85} tint="dark" style={styles.panel}>
            <Text style={styles.panelTitle}>ACTIVE TEAM</Text>
            {activeTeam ? (
              <>
                <Text style={styles.activeName}>{activeTeam.name}</Text>
                <Text style={styles.metaText}>
                  INVITE CODE: {activeTeam.code}
                </Text>
                <Text style={styles.metaText}>
                  MEMBERS: {activeTeam.members.length}
                </Text>
                <TouchableOpacity style={styles.dangerBtn} onPress={leaveTeam}>
                  <Text style={styles.btnText}>LEAVE TEAM</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>No active team selected.</Text>
            )}
          </BlurView>

          <BlurView intensity={85} tint="dark" style={styles.panel}>
            <Text style={styles.panelTitle}>CREATE TEAM</Text>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Team name"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={createTeam}>
              <Text style={styles.btnText}>CREATE + ACTIVATE</Text>
            </TouchableOpacity>
          </BlurView>

          <BlurView intensity={85} tint="dark" style={styles.panel}>
            <Text style={styles.panelTitle}>JOIN TEAM</Text>
            <TextInput
              style={styles.input}
              value={joinCode}
              onChangeText={(text) => setJoinCode(normalizeCode(text))}
              placeholder="Invite code"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={joinTeamByCode}
            >
              <Text style={styles.btnText}>JOIN BY CODE</Text>
            </TouchableOpacity>

            <Text style={styles.quickJoinTitle}>AVAILABLE TEAMS</Text>
            {teams.length === 0 ? (
              <Text style={styles.emptyText}>No teams created yet.</Text>
            ) : (
              teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamRow}
                  onPress={() => quickJoin(team)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>
                      CODE {team.code} | MEMBERS {team.members.length}
                    </Text>
                  </View>
                  <Text style={styles.joinHint}>JOIN</Text>
                </TouchableOpacity>
              ))
            )}
          </BlurView>
        </ScrollView>

        <BottomNav activeTab="team" />
      </ImageBackground>

      <Modal
        visible={successModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
            <View style={styles.alertHeaderBox}>
              <Text style={styles.alertHeaderTextMain}>TEAM</Text>
              <Text style={styles.alertHeaderTextSub}>STATUS</Text>
            </View>

            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>

            <Text style={styles.alertTitle}>{successModal.title}</Text>
            <Text style={styles.alertMessage}>{successModal.message}</Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={() =>
                setSuccessModal((prev) => ({
                  ...prev,
                  visible: false,
                }))
              }
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,122,255,0.3)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  logoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(0,122,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: 4,
  },
  logoTextMain: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  logoTextSub: { color: "#007AFF", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "#555", fontSize: 11, letterSpacing: 3, marginTop: 4 },
  content: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panelTitle: {
    color: "#8ca3be",
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
    fontWeight: "700",
  },
  activeName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  metaText: {
    color: "#9aa3af",
    fontSize: 13,
    marginBottom: 3,
  },
  emptyText: {
    color: "#9aa3af",
    fontSize: 14,
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
  primaryBtn: {
    minHeight: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    marginBottom: 6,
  },
  dangerBtn: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  btnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  quickJoinTitle: {
    color: "#6b7280",
    fontSize: 11,
    letterSpacing: 1.8,
    marginTop: 12,
    marginBottom: 8,
  },
  teamRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,122,255,0.08)",
  },
  teamName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  teamMeta: {
    color: "#9aa3af",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  joinHint: {
    color: "#007AFF",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 12,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertCard: {
    width: "80%",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  alertHeaderBox: { flexDirection: "row", marginBottom: 20 },
  alertHeaderTextMain: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  alertHeaderTextSub: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginLeft: 5,
  },
  successIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 255, 120, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00FF78",
  },
  successIconText: { color: "#00FF78", fontSize: 24, fontWeight: "bold" },
  alertTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  alertMessage: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 25,
  },
  alertButton: {
    backgroundColor: "#007AFF",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
});
