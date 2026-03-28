import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNav({ activeTab = "" }: { activeTab?: string }) {
  const router = useRouter();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalVisible(false);
    router.replace("/");
  };

  const getColor = (key: string) => {
    if (key === "logout") return "#ef4444";
    return activeTab === key ? "#007AFF" : "#555";
  };

  // 2 tab-uri stânga, buton scan centru, 2 tab-uri dreapta — perfect simetric
  const leftTabs = [
    { key: "feed", icon: "home-outline", label: "Feed", route: "/feed" },
    {
      key: "profile",
      icon: "person-outline",
      label: "Profil",
      route: "/profile",
    },
  ];

  const rightTabs = [
    { key: "team", icon: "people-outline", label: "Echipă", route: "/team" },
    { key: "logout", icon: "log-out-outline", label: "Logout", route: null },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Blur background */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Border top */}
      <View style={styles.borderTop} />

      {/* Conținut navbar */}
      <View style={styles.content}>
        {/* Stânga */}
        <View style={styles.side}>
          {leftTabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => router.push(t.route as any)}
            >
              <Ionicons
                name={t.icon as any}
                size={22}
                color={getColor(t.key)}
              />
              <Text style={[styles.label, { color: getColor(t.key) }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Centru — spațiu pentru butonul scan care iese deasupra */}
        <View style={styles.centerSpace} />

        {/* Dreapta */}
        <View style={styles.side}>
          {rightTabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => {
                if (t.key === "logout") handleLogout();
                else router.push(t.route as any);
              }}
            >
              <Ionicons
                name={t.icon as any}
                size={22}
                color={getColor(t.key)}
              />
              <Text style={[styles.label, { color: getColor(t.key) }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buton Scan — poziționat absolut, iese deasupra barei */}
      <TouchableOpacity
        style={styles.scanBtn}
        activeOpacity={0.85}
        onPress={() => router.push("/scan")}
      >
        <View style={styles.scanCircle}>
          <Ionicons name="camera" size={28} color="#fff" />
        </View>
        <Text style={styles.scanLabel}>Scan</Text>
      </TouchableOpacity>

      <Modal visible={isLogoutModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
            <View style={styles.alertHeaderBox}>
              <Text style={styles.alertHeaderTextMain}>SESSION</Text>
              <Text style={styles.alertHeaderTextSub}>STATUS</Text>
            </View>

            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>!</Text>
            </View>

            <Text style={styles.alertTitle}>LOGOUT CONFIRMATION</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to exit the current session?
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.alertCancelButtonText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.alertButton} onPress={confirmLogout}>
                <Text style={styles.alertButtonText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const NAVBAR_H = 75;
const SCAN_SIZE = 60;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: NAVBAR_H,
  },
  borderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,122,255,0.3)",
    zIndex: 2,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  centerSpace: {
    width: SCAN_SIZE + 16,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 9,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Scan button — iese deasupra barei
  scanBtn: {
    position: "absolute",
    top: -(SCAN_SIZE / 2) - 4,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scanCircle: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(0,122,255,0.5)",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  scanLabel: {
    color: "#007AFF",
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.5,
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
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  successIconText: { color: "#ef4444", fontSize: 24, fontWeight: "bold" },
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
    marginBottom: 20,
  },
  alertActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  alertCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  alertCancelButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  alertButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
});
