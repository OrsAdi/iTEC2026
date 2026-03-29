import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNav({ activeTab = "" }: { activeTab?: string }) {
  const router = useRouter();

  const getColor = (key: string) => {
    if (activeTab === key) return "#007AFF";
    if (key === "feed") return "#555";
    return "rgba(0,122,255,0.5)";
  };

  const leftTabs = [
    { key: "feed", icon: "home-outline", label: "Feed", route: "/feed" },
    { key: "profile", icon: "person-outline", label: "Profil", route: "/profile" },
  ];

  const rightTabs = [
    { key: "team", icon: "people-outline", label: "Echipă", route: "/team" },
    { key: "settings", icon: "settings-outline", label: "Setări", route: "/settings" },
  ];

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.borderTop} />
      <View style={styles.content}>
        <View style={styles.side}>
          {leftTabs.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => router.push(t.route as any)}>
              <Ionicons name={t.icon as any} size={22} color={getColor(t.key)} />
              <Text style={[styles.label, { color: getColor(t.key) }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.centerSpace} />
        <View style={styles.side}>
          {rightTabs.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => router.push(t.route as any)}>
              <Ionicons name={t.icon as any} size={22} color={getColor(t.key)} />
              <Text style={[styles.label, { color: getColor(t.key) }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85} onPress={() => router.push("/scan")}>
        <View style={styles.scanCircle}>
          <Ionicons name="camera" size={28} color="#fff" />
        </View>
        <Text style={styles.scanLabel}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const NAVBAR_H = 75;
const SCAN_SIZE = 60;

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, bottom: 0, height: NAVBAR_H },
  borderTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: "rgba(0,122,255,0.3)", zIndex: 2,
  },
  content: { flex: 1, flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  side: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  centerSpace: { width: SCAN_SIZE + 16 },
  tab: { alignItems: "center", justifyContent: "center", flex: 1, paddingTop: 8 },
  label: { fontSize: 9, marginTop: 3, letterSpacing: 0.5 },
  scanBtn: {
    position: "absolute", top: -(SCAN_SIZE / 2) - 4,
    alignSelf: "center", alignItems: "center", zIndex: 10,
  },
  scanCircle: {
    width: SCAN_SIZE, height: SCAN_SIZE, borderRadius: SCAN_SIZE / 2,
    backgroundColor: "#007AFF", alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(0,122,255,0.5)",
    shadowColor: "#007AFF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
  },
  scanLabel: { color: "#007AFF", fontSize: 9, marginTop: 4, letterSpacing: 0.5 },
});