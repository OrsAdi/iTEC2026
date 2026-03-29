import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";

export default function SettingsScreen() {
  const router = useRouter();
  const [logoutModal, setLogoutModal] = useState(false);

  const handleLogout = async () => {
    setLogoutModal(false);
    await supabase.auth.signOut();
    router.replace("/");
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
          <Text style={styles.headerSub}>SETTINGS</Text>
        </BlurView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Account */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>ACCOUNT</Text>
            <TouchableOpacity style={styles.row} onPress={() => router.push("/profile")}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="person-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push("/team")}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="people-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Echipă</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </BlurView>

          {/* App — fără Scanează afiș */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>APP</Text>
            <TouchableOpacity style={styles.row} onPress={() => router.push("/feed")}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="images-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Feed afișe</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </BlurView>

          {/* Info */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>INFO</Text>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Versiune</Text>
              </View>
              <Text style={styles.rowValue}>1.0.26</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="code-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Build</Text>
              </View>
              <Text style={styles.rowValue}>iTEC OVERRIDE</Text>
            </View>
          </BlurView>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutModal(true)}
            activeOpacity={0.8}
          >
            <BlurView intensity={60} tint="dark" style={styles.logoutBtnInner}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutBtnText}>LOGOUT</Text>
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.version}>VER. 1.0.26 | iTEC OVERRIDE</Text>
        </ScrollView>

        <BottomNav activeTab="settings" />
      </View>

      {/* Logout Modal */}
      <Modal visible={logoutModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderMain}>SESSION</Text>
              <Text style={styles.modalHeaderSub}> STATUS</Text>
            </View>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>LOGOUT CONFIRMATION</Text>
            <Text style={styles.modalMessage}>
              Ești sigur că vrei să ieși din cont?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLogoutBtn} onPress={handleLogout}>
                <Text style={styles.modalLogoutText}>LOGOUT</Text>
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
  card: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardTitle: {
    color: "#007AFF", fontSize: 11, fontWeight: "bold",
    letterSpacing: 2, marginBottom: 16,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(0,122,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { color: "#fff", fontSize: 14, fontWeight: "500" },
  rowValue: { color: "#555", fontSize: 12 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 2 },
  logoutBtn: {
    borderRadius: 20, overflow: "hidden", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  logoutBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, gap: 10, backgroundColor: "rgba(239,68,68,0.08)",
  },
  logoutBtnText: { color: "#ef4444", fontSize: 15, fontWeight: "bold", letterSpacing: 2 },
  version: { color: "#333", fontSize: 10, textAlign: "center", letterSpacing: 1, marginTop: 8 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center", alignItems: "center",
  },
  modalCard: {
    width: "80%", borderRadius: 25, padding: 30, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.4)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalHeader: { flexDirection: "row", marginBottom: 20 },
  modalHeaderMain: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  modalHeaderSub: { color: "#007AFF", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  modalIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 15, borderWidth: 1, borderColor: "#ef4444",
  },
  modalIconText: { color: "#ef4444", fontSize: 24, fontWeight: "bold" },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  modalMessage: {
    color: "rgba(255,255,255,0.6)", fontSize: 12,
    textAlign: "center", lineHeight: 18, marginBottom: 20,
  },
  modalActions: { width: "100%", flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalCancelText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  modalLogoutBtn: {
    flex: 1, backgroundColor: "#ef4444",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  modalLogoutText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
});