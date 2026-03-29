import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import { supabase } from "./lib/supabase";

import type { PosterEntry } from "./lib/storage";
import {
  DrawPath,
  getPoster,
  resetPosterToOriginal,
  updateDrawing,
} from "./lib/storage";

const COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#FFFFFF", "#000000",
];
const STROKE_WIDTHS = [2, 4, 8, 14];

function pathsToD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

function parseDrawPaths(raw: unknown): DrawPath[] {
  if (Array.isArray(raw)) return raw as DrawPath[];
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DrawPath[]) : [];
  } catch {
    return [];
  }
}

async function uploadAnnotatedImage(
  localUri: string,
  posterId: string
): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return null;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const lookup: Record<string, number> = {};
    for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i;
    const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 4) {
      const b0 = lookup[clean[i]] ?? 0;
      const b1 = lookup[clean[i + 1]] ?? 0;
      const b2 = lookup[clean[i + 2]] ?? 0;
      const b3 = lookup[clean[i + 3]] ?? 0;
      bytes.push((b0 << 2) | (b1 >> 4));
      bytes.push(((b1 & 0xf) << 4) | (b2 >> 2));
      bytes.push(((b2 & 0x3) << 6) | b3);
    }
    const uint8 = new Uint8Array(bytes);

    // Upload cu suffix _annotated ca să nu suprascrie originalul
    const filePath = `${userId}/${posterId}_annotated.jpg`;
    const { error } = await supabase.storage
      .from("posters")
      .upload(filePath, uint8, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) return null;

    const { data } = supabase.storage.from("posters").getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export default function DrawScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [poster, setPoster] = useState<PosterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[]>([]);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [activeWidth, setActiveWidth] = useState(STROKE_WIDTHS[1]);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const activeColorRef = useRef(activeColor);
  const activeWidthRef = useRef(activeWidth);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);
  useEffect(() => { activeWidthRef.current = activeWidth; }, [activeWidth]);

  useEffect(() => {
    if (!id) return;
    getPoster(id).then((entry) => {
      if (entry) {
        setPoster(entry);
        setPaths(parseDrawPaths(entry.drawingData as unknown));
      }
      setLoading(false);
    });
  }, [id]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((e) => {
      currentPoints.current = [{ x: e.x, y: e.y }];
      setLivePoints([{ x: e.x, y: e.y }]);
    })
    .onUpdate((e) => {
      currentPoints.current = [...currentPoints.current, { x: e.x, y: e.y }];
      setLivePoints([...currentPoints.current]);
    })
    .onEnd(() => {
      const completed = [...currentPoints.current];
      if (completed.length > 0) {
        setPaths((prev) => [...prev, {
          points: completed,
          color: activeColorRef.current,
          strokeWidth: activeWidthRef.current,
        }]);
      }
      currentPoints.current = [];
      setLivePoints([]);
    });

  const handleUndo = useCallback(() => setPaths((prev) => prev.slice(0, -1)), []);

  const handleClear = useCallback(() => {
    setClearConfirmVisible(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setPaths([]);
    setClearConfirmVisible(false);
  }, []);

  const handleDelete = useCallback(() => {
    setDeleteConfirmVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!id) {
      setDeleteConfirmVisible(false);
      return;
    }
    try {
      const originalImageUri = await resetPosterToOriginal(id);
      setPaths([]);
      if (originalImageUri) {
        setPoster((prev) => (prev ? {
          ...prev,
          imageUri: originalImageUri,
          drawingData: "[]",
          updatedAt: Date.now(),
        } : prev));
      }
      setDeleteConfirmVisible(false);
    } catch {
      Alert.alert("Eroare", "Nu s-au putut șterge adnotările.");
    }
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Salvează doar adnotările; imaginea de bază rămâne cea inițială.
      await updateDrawing(id, JSON.stringify(paths));

      setSaveSuccessVisible(true);
    } catch {
      Alert.alert("Eroare", "Nu s-a putut salva.");
    } finally {
      setSaving(false);
    }
  }, [id, paths]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );

  if (!poster) return (
    <View style={styles.center}>
      <Text style={{ color: "#fff" }}>Afișul nu a fost găsit.</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Înapoi</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{poster.title}</Text>
            <Text style={styles.headerDate}>
              {new Date(poster.createdAt).toLocaleDateString("ro-RO")}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Salvează</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas cu ViewShot pentru captură */}
        <GestureDetector gesture={panGesture}>
          <ViewShot
            ref={viewShotRef}
            style={styles.canvasContainer}
            options={{ format: "jpg", quality: 0.9 }}
          >
            <Image
              source={{ uri: poster.imageUri }}
              style={styles.posterImage}
              resizeMode="contain"
            />
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((path, idx) => (
                <Path
                  key={idx}
                  d={pathsToD(path.points)}
                  stroke={path.color}
                  strokeWidth={path.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {livePoints.length > 0 && (
                <Path
                  d={pathsToD(livePoints)}
                  stroke={activeColorRef.current}
                  strokeWidth={activeWidthRef.current}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </Svg>
          </ViewShot>
        </GestureDetector>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.colorRow}
            contentContainerStyle={styles.colorRowContent}
          >
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  activeColor === color && styles.colorSwatchActive,
                ]}
                onPress={() => setActiveColor(color)}
              />
            ))}
          </ScrollView>
          <View style={styles.strokeRow}>
            {STROKE_WIDTHS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.strokeBtn, activeWidth === w && styles.strokeBtnActive]}
                onPress={() => setActiveWidth(w)}
              >
                <View style={{
                  width: w * 1.8, height: w * 1.8,
                  borderRadius: w, backgroundColor: activeColor,
                }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.actionBtn} onPress={handleUndo}>
              <Text style={styles.actionBtnText}>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#7f1d1d" }]}
              onPress={handleClear}
            >
              <Text style={styles.actionBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={saveSuccessVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>SAVE</Text>
                <Text style={styles.alertHeaderTextSub}> STATUS</Text>
              </View>
              <View style={styles.successIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.alertTitle}>SALVAT CU SUCCES</Text>
              <Text style={styles.alertMessage}>Adnotările au fost salvate.</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setSaveSuccessVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

        <Modal visible={deleteConfirmVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>POSTER</Text>
                <Text style={styles.alertHeaderTextSub}> STATUS</Text>
              </View>
              <View style={styles.deleteIconCircle}>
                <Text style={styles.deleteIconText}>!</Text>
              </View>
              <Text style={styles.alertTitle}>DELETE ALL NOTES</Text>
              <Text style={styles.alertMessage}>
                Vrei să ștergi toate adnotările salvate de pe "{poster?.title}"?
              </Text>
              <TouchableOpacity style={styles.alertDeleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.alertButtonText}>DELETE ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

        <Modal visible={clearConfirmVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>ANNOTATION</Text>
                <Text style={styles.alertHeaderTextSub}> STATUS</Text>
              </View>
              <View style={styles.deleteIconCircle}>
                <Text style={styles.deleteIconText}>!</Text>
              </View>
              <Text style={styles.alertTitle}>DELETE ALL NOTES</Text>
              <Text style={styles.alertMessage}>Vrei să elimini toate adnotările de pe acest afiș?</Text>
              <TouchableOpacity style={styles.alertDeleteButton} onPress={handleConfirmClear}>
                <Text style={styles.alertButtonText}>DELETE ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={() => setClearConfirmVisible(false)}
              >
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f0f0f" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingTop: 55, paddingBottom: 14,
    backgroundColor: "#1a1a1a", borderBottomWidth: 1, borderBottomColor: "#2a2a2a",
  },
  backBtn: { padding: 4 },
  backBtnText: { color: "#007AFF", fontSize: 14 },
  headerCenter: { flex: 1, alignItems: "center", marginHorizontal: 8 },
  headerTitle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  headerDate: { color: "#555", fontSize: 11, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#007AFF", paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 8, minWidth: 80, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  canvasContainer: { flex: 1, backgroundColor: "#000" },
  posterImage: { ...StyleSheet.absoluteFillObject },
  toolbar: {
    backgroundColor: "#1a1a1a", paddingBottom: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: "#2a2a2a",
  },
  colorRow: { maxHeight: 44 },
  colorRowContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  colorSwatchActive: { borderColor: "#fff", transform: [{ scale: 1.2 }] },
  strokeRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  strokeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent",
  },
  strokeBtnActive: { borderColor: "#007AFF" },
  actionBtn: {
    marginLeft: "auto", backgroundColor: "#374151",
    width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  actionBtnText: { fontSize: 18 },
  modalOverlay: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center", alignItems: "center",
  },
  customAlertCard: {
    width: "80%", borderRadius: 25, padding: 30, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.4)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.45)",
  },
  alertHeaderBox: { flexDirection: "row", marginBottom: 20 },
  alertHeaderTextMain: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  alertHeaderTextSub: { color: "#007AFF", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  successIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(0,255,120,0.1)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 15, borderWidth: 1, borderColor: "#00FF78",
  },
  successIconText: { color: "#00FF78", fontSize: 24, fontWeight: "bold" },
  deleteIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 15, borderWidth: 1, borderColor: "#ef4444",
  },
  deleteIconText: { color: "#ef4444", fontSize: 24, fontWeight: "bold" },
  alertTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  alertMessage: {
    color: "rgba(255,255,255,0.7)", fontSize: 12,
    textAlign: "center", lineHeight: 18, marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#007AFF", width: "100%",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  alertDeleteButton: {
    backgroundColor: "#ef4444", width: "100%",
    paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 10,
  },
  alertCancelButton: {
    width: "100%", paddingVertical: 12, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)",
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  alertCancelText: { color: "#ddd", fontWeight: "700", letterSpacing: 1 },
});