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
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
const GIF_OPTIONS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2xqN2I0c2F2dWN4eXV6dDZ0aWh6bWI1Y2x4dnF0a2YwdW9qdjNnMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ICOgUNjpvO0PC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHVmNnM2MzVibnNmbWwwNDUydDV4N2FwNTA2N2RoMjlpczhqN2d0dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlNaQ6gWfllcjDO/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2xwbHRiYjI1ZW5tOHVhZm5uN2MyZ2Q3c2l4NWIzMmVhM2NncTBpYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnN3d2FscDd5d3J2M3RlcWl6a2s0djNyb2xud3NrdXN5ejF5MjVwNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fxsqOYnIMEefC/giphy.gif",
];

type GifSticker = {
  id: string;
  uri: string;
  x: number; // 0..1 normalized on canvas width
  y: number; // 0..1 normalized on canvas height
  size: number; // relative to canvas width
};

type AnnotationPayload = {
  paths: DrawPath[];
  stickers: GifSticker[];
};

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

function parseAnnotationPayload(raw: unknown): AnnotationPayload {
  const empty: AnnotationPayload = { paths: [], stickers: [] };

  if (Array.isArray(raw)) return { paths: raw as DrawPath[], stickers: [] };
  if (typeof raw !== "string") return empty;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { paths: parsed as DrawPath[], stickers: [] };

    if (parsed && typeof parsed === "object") {
      const paths = Array.isArray((parsed as any).paths)
        ? ((parsed as any).paths as DrawPath[])
        : [];
      const stickers = Array.isArray((parsed as any).stickers)
        ? ((parsed as any).stickers as GifSticker[])
        : [];
      return { paths, stickers };
    }

    return empty;
  } catch {
    return empty;
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
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [gifUrlInput, setGifUrlInput] = useState("");
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isStickerMode, setIsStickerMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [stickers, setStickers] = useState<GifSticker[]>([]);
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[]>([]);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [activeWidth, setActiveWidth] = useState(STROKE_WIDTHS[1]);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const activeColorRef = useRef(activeColor);
  const activeWidthRef = useRef(activeWidth);
  const viewShotRef = useRef<ViewShot>(null);
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);
  useEffect(() => { activeWidthRef.current = activeWidth; }, [activeWidth]);

  useEffect(() => {
    if (!id) return;
    getPoster(id).then((entry) => {
      if (entry) {
        setPoster(entry);
        const payload = parseAnnotationPayload(entry.drawingData as unknown);
        setPaths(payload.paths);
        setStickers(payload.stickers);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (stickers.length > 0) setIsStickerMode(true);
  }, [stickers.length]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(!isStickerMode)
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
    setStickers([]);
    setClearConfirmVisible(false);
  }, []);

  const addGifSticker = useCallback((uri: string) => {
    const clean = uri.trim();
    if (!clean) return;
    const newSticker: GifSticker = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      uri: clean,
      x: 0.5,
      y: 0.5,
      size: 0.26,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setIsStickerMode(true);
    setGifPickerVisible(false);
    setGifUrlInput("");
  }, []);

  const updateSticker = useCallback((idToUpdate: string, update: Partial<GifSticker>) => {
    setStickers((prev) => prev.map((s) => (s.id === idToUpdate ? { ...s, ...update } : s)));
  }, []);

  const moveStickerDrag = useCallback((stickerId: string, dx: number, dy: number) => {
    const drag = dragStartRef.current;
    if (!drag || drag.id !== stickerId) return;

    const dragGain = 1.9;
    const dxNorm = (dx / Math.max(1, canvasSize.width)) * dragGain;
    const dyNorm = (dy / Math.max(1, canvasSize.height)) * dragGain;

    updateSticker(stickerId, {
      x: Math.max(-0.8, Math.min(1.8, drag.x + dxNorm)),
      y: Math.max(-0.8, Math.min(1.8, drag.y + dyNorm)),
    });
  }, [canvasSize.height, canvasSize.width, updateSticker]);

  const beginStickerDrag = useCallback((sticker: GifSticker) => {
    setSelectedStickerId(sticker.id);
    setIsStickerMode(true);
    dragStartRef.current = { id: sticker.id, x: sticker.x, y: sticker.y };
  }, []);

  const endStickerDrag = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  const resizeSelectedSticker = useCallback((delta: number) => {
    if (!selectedStickerId) return;
    setStickers((prev) =>
      prev.map((s) =>
        s.id === selectedStickerId
          ? { ...s, size: Math.max(0.1, Math.min(0.7, s.size + delta)) }
          : s
      )
    );
  }, [selectedStickerId]);

  const getStickerPanHandlers = useCallback(
    (sticker: GifSticker) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => beginStickerDrag(sticker),
        onPanResponderMove: (_evt, gestureState) => moveStickerDrag(sticker.id, gestureState.dx, gestureState.dy),
        onPanResponderRelease: endStickerDrag,
        onPanResponderTerminate: endStickerDrag,
        onPanResponderTerminationRequest: () => false,
      }).panHandlers,
    [beginStickerDrag, endStickerDrag, moveStickerDrag]
  );

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
      setStickers([]);
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
      await updateDrawing(id, JSON.stringify({ paths, stickers }));

      setSaveSuccessVisible(true);
    } catch {
      Alert.alert("Eroare", "Nu s-a putut salva.");
    } finally {
      setSaving(false);
    }
  }, [id, paths, stickers]);

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
            <TouchableOpacity
              style={[styles.modeBtn, isStickerMode && styles.modeBtnActive]}
              onPress={() => setIsStickerMode((prev) => !prev)}
            >
              <Text style={styles.modeBtnText}>{isStickerMode ? "Sticker" : "Draw"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas cu ViewShot pentru captură */}
        <GestureDetector gesture={panGesture}>
          <ViewShot
            ref={viewShotRef}
            style={styles.canvasContainer}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setCanvasSize({ width, height });
            }}
            options={{ format: "jpg", quality: 0.9 }}
          >
            <Image
              source={{ uri: poster.imageUri }}
              style={styles.posterImage}
              resizeMode="contain"
            />
            {stickers.map((sticker) => {
              const sizePx = Math.max(42, Math.min(canvasSize.width * 0.7, sticker.size * canvasSize.width));
              const left = sticker.x * canvasSize.width - sizePx / 2;
              const top = sticker.y * canvasSize.height - sizePx / 2;

              return (
                <View
                  key={sticker.id}
                  style={[
                    styles.gifSticker,
                    selectedStickerId === sticker.id && styles.gifStickerSelected,
                    { width: sizePx, height: sizePx, left, top },
                  ]}
                  {...getStickerPanHandlers(sticker)}
                >
                  <Image source={{ uri: sticker.uri }} style={styles.gifStickerImage} resizeMode="contain" />
                </View>
              );
            })}
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            style={styles.actionsScroll}
            contentContainerStyle={styles.strokeRow}
          >
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
            <TouchableOpacity
              style={[styles.actionBtn, styles.gifBtn]}
              onPress={() => setGifPickerVisible(true)}
            >
              <Text style={styles.actionBtnText}>GIF</Text>
            </TouchableOpacity>
            {selectedStickerId && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.resizeBtn]} onPress={() => resizeSelectedSticker(-0.03)}>
                  <Text style={styles.actionBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.resizeBtn]} onPress={() => resizeSelectedSticker(0.03)}>
                  <Text style={styles.actionBtnText}>+</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        <Modal visible={gifPickerVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>GIF</Text>
                <Text style={styles.alertHeaderTextSub}> PICKER</Text>
              </View>
              <Text style={styles.alertMessage}>Alege un GIF preset sau pune link direct.</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gifRow}
                style={styles.gifScroll}
              >
                {GIF_OPTIONS.map((gif) => (
                  <TouchableOpacity key={gif} onPress={() => addGifSticker(gif)} style={styles.gifThumbWrap}>
                    <Image source={{ uri: gif }} style={styles.gifThumb} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={gifUrlInput}
                onChangeText={setGifUrlInput}
                placeholder="https://...gif"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.gifInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity style={styles.alertButton} onPress={() => addGifSticker(gifUrlInput)}>
                <Text style={styles.alertButtonText}>ADD GIF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertCancelButton} onPress={() => setGifPickerVisible(false)}>
                <Text style={styles.alertCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

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
  modeBtn: {
    backgroundColor: "#334155", paddingHorizontal: 10,
    paddingVertical: 7, borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: "#0ea5e9" },
  modeBtnText: { color: "#fff", fontWeight: "700", fontSize: 11 },
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
  actionsScroll: { width: "100%", maxHeight: 56 },
  strokeRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, gap: 8, paddingBottom: 4 },
  strokeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent",
  },
  strokeBtnActive: { borderColor: "#007AFF" },
  actionBtn: {
    marginLeft: "auto", backgroundColor: "#374151",
    width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  gifBtn: { backgroundColor: "#1d4ed8", width: 52 },
  resizeBtn: { backgroundColor: "#0f766e", marginLeft: 0 },
  actionBtnText: { fontSize: 18 },
  gifSticker: { position: "absolute", borderRadius: 8, zIndex: 20 },
  gifStickerSelected: { borderWidth: 2, borderColor: "#22d3ee" },
  gifStickerImage: { width: "100%", height: "100%" },
  gifScroll: { width: "100%", maxHeight: 82, marginBottom: 12 },
  gifRow: { gap: 8, paddingVertical: 4 },
  gifThumbWrap: {
    width: 72, height: 72, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  gifThumb: { width: "100%", height: "100%" },
  gifInput: {
    width: "100%", marginBottom: 12, color: "#fff", fontSize: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
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