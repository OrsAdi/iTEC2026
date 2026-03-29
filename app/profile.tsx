import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
import { getAllPosters } from "./lib/storage";
import { supabase } from "./lib/supabase";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

const availableAvatars = [
  { id: "1", uri: "https://api.dicebear.com/7.x/bottts/png?seed=1" },
  { id: "2", uri: "https://api.dicebear.com/7.x/bottts/png?seed=2" },
  { id: "3", uri: "https://api.dicebear.com/7.x/bottts/png?seed=3" },
  { id: "4", uri: "https://api.dicebear.com/7.x/bottts/png?seed=4" },
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState(availableAvatars[0].uri);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [posterCount, setPosterCount] = useState(0);
  const [annotatedCount, setAnnotatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

      if (!error && data) {
        setProfile({
          id: data.id,
          email: session.session.user.email || "",
          username: data.full_name || "Unknown User",
          avatar_url: data.avatar_url || availableAvatars[0].uri,
          created_at: data.updated_at || new Date().toISOString(),
        });
        setEditName(data.full_name || "");
        setEditAvatar(data.avatar_url || availableAvatars[0].uri);
      }
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

  const handleSaveProfile = async () => {
    try {
      if (!profile) return;
      const updates = {
        id: profile.id,
        full_name: editName,
        avatar_url: editAvatar,
        updated_at: new Date(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      setProfile({ ...profile, username: editName, avatar_url: editAvatar });
      setIsEditing(false);
      setIsAlertVisible(true);
    } catch (error: any) {
      alert("Error updating profile: " + error.message);
    }
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

          {/* Avatar & Identitate */}
          <BlurView intensity={60} tint="dark" style={styles.avatarCard}>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setIsAvatarModalVisible(true)}
                style={styles.avatarEditTouch}
              >
                <Image source={{ uri: editAvatar }} style={styles.avatarImage} />
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarCircle}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={48} color="#007AFF" />
                )}
              </View>
            )}

            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#555"
              />
            ) : (
              <Text style={styles.emailText}>{profile?.username ?? "—"}</Text>
            )}

            <Text style={styles.joinedText}>
              Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ro-RO") : "—"}
            </Text>

            {isEditing ? (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#007AFF" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
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

          <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
        </ScrollView>

        {/* Modal Avatar */}
        <Modal visible={isAvatarModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
              <Text style={[styles.infoCardTitle, { marginBottom: 20, fontSize: 16 }]}>
                SELECT AVATAR
              </Text>
              <FlatList
                data={availableAvatars}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { setEditAvatar(item.uri); setIsAvatarModalVisible(false); }}
                    style={styles.avatarOption}
                  >
                    <Image source={{ uri: item.uri }} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)} style={{ marginTop: 20 }}>
                <Text style={{ color: "#007AFF", fontWeight: "bold" }}>CANCEL</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

        {/* Modal Success */}
        <Modal visible={isAlertVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <Ionicons name="checkmark-circle" size={50} color="#00FF78" style={{ marginBottom: 10 }} />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
                PROFILE UPDATED
              </Text>
              <TouchableOpacity
                style={[styles.saveBtn, { width: "100%", marginTop: 15 }]}
                onPress={() => setIsAlertVisible(false)}
              >
                <Text style={styles.saveBtnText}>OK</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

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
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 45 },
  avatarEditTouch: {
    position: "relative", width: 90, height: 90,
    marginBottom: 12, borderRadius: 45,
    borderWidth: 2, borderColor: "#007AFF",
  },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: "#007AFF", width: 28, height: 28,
    borderRadius: 14, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#000",
  },
  emailText: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  joinedText: { color: "#555", fontSize: 12, letterSpacing: 1 },
  nameInput: {
    color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: "#007AFF",
    minWidth: 150, textAlign: "center", paddingBottom: 5,
  },
  editBtn: {
    flexDirection: "row", alignItems: "center", marginTop: 15,
    paddingHorizontal: 15, paddingVertical: 8,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,122,255,0.3)",
  },
  editBtnText: { color: "#007AFF", fontSize: 12, fontWeight: "bold", marginLeft: 6 },
  saveBtn: {
    marginTop: 15, paddingHorizontal: 25,
    paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold", letterSpacing: 1, textAlign: "center" },
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
  version: { color: "#333", fontSize: 10, textAlign: "center", letterSpacing: 1, marginTop: 8 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center", alignItems: "center",
  },
  modalContainer: {
    width: "80%", borderRadius: 25, padding: 25, alignItems: "center",
    overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,122,255,0.3)",
  },
  avatarOption: { margin: 10 },
  avatarOptionImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: "#444" },
  customAlertCard: {
    width: "70%", borderRadius: 25, padding: 30, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,255,120,0.4)", overflow: "hidden",
  },
});