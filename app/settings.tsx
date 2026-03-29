import { Ionicons } from "@expo/vector-icons";
 
import { Audio } from "expo-av"; // <--- IMPORTUL NOU
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- SETUL DE GHICITORI IN ENGLEZĂ ---
const graffitiRiddles = [
  {
    id: 1,
    question:
      "I am the first line of spray on the wall, the foundation of any piece. What am I called?",
    options: ["Fill-in", "Outline", "Background"],
    correctIndex: 1,
  },
  {
    id: 2,
    question:
      "Once, in Ancient Rome, I was written on walls. Now I am the core of street art. What am I?",
    options: ["Spraycan", "Tag", "GlitchTag"],
    correctIndex: 1,
  },
  {
    id: 3,
    question:
      "I am the fastest piece, often executed in a single, continuous motion. What am I?",
    options: ["Throw-up", "Blockbuster", "Wildstyle"],
    correctIndex: 0,
  },
  {
    id: 4,
    question:
      "Without me, your spray can is useless. I control the flow of the paint. What am I?",
    options: ["Nozzle", "Marker", "Cap"],
    correctIndex: 2,
  },
  {
    id: 5,
    question:
      "What is considered the 'holy grail' of graffiti canvases, coveted by all writers?",
    options: ["Legal wall", "Bridge", "Subway train"],
    correctIndex: 2,
  },
];

export default function SettingsScreen() {
  const router = useRouter();

  const [logoutModal, setLogoutModal] = useState(false);
  const [isRiddleModalVisible, setIsRiddleModalVisible] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState(graffitiRiddles[0]);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    icon: "checkmark-circle" as any,
    color: "#00FF78",
  });

  const [isDoorAnimating, setIsDoorAnimating] = useState(false);
  const doorAnim = useRef(new Animated.Value(0)).current;

  // --- LOGICĂ PENTRU SUNET ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  async function playSciFiSound() {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require("../assets/images/door.mp3"),
      );
      setSound(newSound);
      await newSound.playAsync();
      return newSound; // <--- Returnăm sunetul ca să-l putem opri mai târziu
    } catch (error) {
      console.log("Eroare la redarea sunetului: ", error);
      return null;
    }
  }

  // Curățăm memoria audio la final
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- LOGICĂ UȘĂ + SUNET ---
  const handleLogoPress = async () => {
    if (isDoorAnimating) return;

    setIsDoorAnimating(true);
    doorAnim.setValue(0);

    // Pornim melodia și o salvăm într-o variabilă locală
    const currentSound = await playSciFiSound();

    Animated.timing(doorAnim, {
      toValue: 1,
      duration: 3500, // Ușa se deschide în 3.5 secunde
      useNativeDriver: true,
    }).start(async () => {
      // Aici se execută codul DUPĂ ce se termină animația
      setIsDoorAnimating(false);

      // Oprim melodia INSTANT!
      if (currentSound) {
        await currentSound.stopAsync();
      }
    });
  };
  const leftDoorTranslate = doorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH / 2],
  });

  const rightDoorTranslate = doorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2],
  });

  const handleLogout = async () => {
    setLogoutModal(false);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleVersionPress = () => {
    const randomIndex = Math.floor(Math.random() * graffitiRiddles.length);
    setCurrentRiddle(graffitiRiddles[randomIndex]);
    setIsRiddleModalVisible(true);
  };

  const handleAnswer = (selectedIndex: number) => {
    setIsRiddleModalVisible(false);

    if (selectedIndex === currentRiddle.correctIndex) {
      setAlertConfig({
        title: "CORRECT!",
        message: "Amazing! You know the streets as well as I do. Keep it up!",
        icon: "checkmark-circle",
        color: "#00FF78",
      });
    } else {
      setAlertConfig({
        title: "WRONG!",
        message:
          "You still have much to learn, young apprentice. The streets don't forgive, nor do they forget.",
        icon: "close-circle",
        color: "#FF4444",
      });
    }

    setTimeout(() => setIsAlertVisible(true), 300);
  };

  return (
    <AppBackground>
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogoPress}>
            <View style={styles.logoBox}>
              <Text style={styles.logoTextMain}>GLITCH_</Text>
              <Text style={styles.logoTextSub}>TAG</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerSub}>SETTINGS</Text>
        </BlurView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/profile")}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="person-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/team")}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="people-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Team</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </BlurView>

          {/* App */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>APP</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/feed")}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="images-outline" size={18} color="#007AFF" />
                </View>
                <Text style={styles.rowLabel}>Poster Feed</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </BlurView>

          {/* Info */}
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>INFO</Text>

            <TouchableOpacity
              style={styles.row}
              onPress={handleVersionPress}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#007AFF"
                  />
                </View>
                <Text style={styles.rowLabel}>Version</Text>
              </View>
              <Text style={styles.rowValue}>1.0.26</Text>
            </TouchableOpacity>

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

      {/* --- EASTER EGG DOOR ANIMATION --- */}
      {isDoorAnimating && (
        <View style={styles.doorContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.doorLeft,
              { transform: [{ translateX: leftDoorTranslate }] },
            ]}
          >
            <View style={styles.doorEdgeRight} />
            <Text style={styles.doorTextLeft}>GLITCH_</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.doorRight,
              { transform: [{ translateX: rightDoorTranslate }] },
            ]}
          >
            <View style={styles.doorEdgeLeft} />
            <Text style={styles.doorTextRight}>TAG</Text>
          </Animated.View>
        </View>
      )}

      {/* --- LOGOUT MODAL --- */}
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
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.modalLogoutText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* --- RIDDLE MODAL --- */}
      <Modal visible={isRiddleModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.modalCard}>
            <Text
              style={[styles.cardTitle, { marginBottom: 20, fontSize: 16 }]}
            >
              GRAFFITI RIDDLE
            </Text>
            <Text style={styles.riddleQuestion}>
              "{currentRiddle.question}"
            </Text>
            <View style={styles.riddleOptions}>
              {currentRiddle.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswer(index)}
                  style={styles.riddleOptionBtn}
                >
                  <Text style={styles.riddleOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setIsRiddleModalVisible(false)}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                CLOSE
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* --- RESULT MODAL --- */}
      <Modal visible={isAlertVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={95}
            tint="dark"
            style={[styles.modalCard, { borderColor: alertConfig.color }]}
          >
            <Ionicons
              name={alertConfig.icon}
              size={60}
              color={alertConfig.color}
              style={{ marginBottom: 15 }}
            />
            <Text
              style={{
                color: alertConfig.color,
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
                letterSpacing: 1,
              }}
            >
              {alertConfig.title}
            </Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalLogoutBtn,
                { width: "100%", backgroundColor: alertConfig.color },
              ]}
              onPress={() => setIsAlertVisible(false)}
            >
              <Text
                style={[
                  styles.modalLogoutText,
                  { color: alertConfig.color === "#00FF78" ? "#000" : "#fff" },
                ]}
              >
                OK
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardTitle: {
    color: "#007AFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,122,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { color: "#fff", fontSize: 14, fontWeight: "500" },
  rowValue: { color: "#555", fontSize: 12 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 2,
  },
  logoutBtn: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  logoutBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  logoutBtnText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  version: {
    color: "#333",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  modalCard: {
    width: "80%",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalHeader: { flexDirection: "row", marginBottom: 20 },
  modalHeaderMain: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  modalHeaderSub: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  modalIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  modalIconText: { color: "#ef4444", fontSize: 24, fontWeight: "bold" },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  modalMessage: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: { width: "100%", flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalCancelText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  modalLogoutBtn: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalLogoutText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },

  riddleQuestion: {
    color: "#fff",
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  riddleOptions: { width: "100%", gap: 10 },
  riddleOptionBtn: {
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.3)",
  },
  riddleOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  doorContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: "row",
  },
  doorLeft: {
    width: "50%",
    height: "100%",
    backgroundColor: "#000a1a",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
  },
  doorRight: {
    width: "50%",
    height: "100%",
    backgroundColor: "#000a1a",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  doorEdgeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  doorEdgeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  doorTextLeft: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
  },
  doorTextRight: {
    color: "#007AFF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
