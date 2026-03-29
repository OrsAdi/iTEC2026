import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
    deletePoster,
    DrawPath,
    getPoster,
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
        try { setPaths(JSON.parse(entry.drawingData)); } catch { setPaths([]); }
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
    Alert.alert("Șterge adnotările?", "Vrei să elimini toate desenele?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: () => setPaths([]) },
    ]);
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "DELETE_POSTER",
      `Vrei să ștergi afișul "${poster?.title}" din feed?`,
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "DELETE",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            await deletePoster(id);
            router.replace("/feed");
          },
        },
      ]
    );
  }, [id, poster, router]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      // 1. Salvează drawing data în storage
      await updateDrawing(id, JSON.stringify(paths));

      // 2. Capturează canvas-ul (imagine + desen) cu ViewShot
      let annotatedUrl: string | null = null;
      if (viewShotRef.current?.capture) {
        const capturedUri = await viewShotRef.current.capture();

        // 3. Copiază în folderul local
        const destDir = FileSystem.documentDirectory + "posters/";
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        const destUri = destDir + `poster_${id}_annotated.jpg`;
        await FileSystem.copyAsync({ from: capturedUri, to: destUri });

        // 4. Uploadează imaginea cu desen în Supabase
        annotatedUrl = await uploadAnnotatedImage(destUri, id);

        // 5. Actualizează imageUri local cu imaginea adnotată
        if (annotatedUrl) {
          await supabase
            .from("posters")
            .update({ image_url: annotatedUrl, updated_at: new Date().toISOString() })
            .eq("id", id);
        }
      }

      Alert.alert("Salvat! ✅", "Adnotările au fost salvate.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Eroare", "Nu s-a putut salva.");
    } finally {
      setSaving(false);
    }
  }, [id, paths, router]);

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
});