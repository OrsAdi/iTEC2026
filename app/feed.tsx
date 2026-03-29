import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import AppBackground from "./components/AppBackground";
import BottomNav from "./components/BottomNav";
import {
  deletePoster,
  DrawPath,
  getAllPosters,
  PosterEntry,
  syncPostersFromSupabase,
} from "./lib/storage";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - CARD_GAP * 3) / 2;
const CARD_H = CARD_W * 1.3;
const CARD_IMAGE_H = CARD_H - 44;

type GifSticker = {
  id: string;
  uri: string;
  x: number;
  y: number;
  size: number;
};

type AnnotationPayload = {
  paths: DrawPath[];
  stickers: GifSticker[];
  musicStickers: MusicSticker[];
};

type MusicSticker = {
  id: string;
  title: string;
  uri: string;
  x: number;
  y: number;
  size: number;
  startSec: number;
  durationSec: number;
};

function pathsToD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ")
  );
}

function parseAnnotationPayload(raw: unknown): AnnotationPayload {
  const empty: AnnotationPayload = {
    paths: [],
    stickers: [],
    musicStickers: [],
  };
  if (Array.isArray(raw))
    return { paths: raw as DrawPath[], stickers: [], musicStickers: [] };
  if (typeof raw !== "string") return empty;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return { paths: parsed as DrawPath[], stickers: [], musicStickers: [] };
    if (parsed && typeof parsed === "object") {
      return {
        paths: Array.isArray((parsed as any).paths)
          ? ((parsed as any).paths as DrawPath[])
          : [],
        stickers: Array.isArray((parsed as any).stickers)
          ? ((parsed as any).stickers as GifSticker[])
          : [],
        musicStickers: Array.isArray((parsed as any).musicStickers)
          ? ((parsed as any).musicStickers as MusicSticker[])
          : [],
      };
    }
    return empty;
  } catch {
    return empty;
  }
}

function normalizePathsForCard(
  paths: DrawPath[],
  targetW: number,
  targetH: number,
): DrawPath[] {
  if (paths.length === 0) return [];
  const points = paths.flatMap((p) => p.points);
  if (points.length === 0) return [];

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const pt of points) {
    if (!isFinite(pt.x) || !isFinite(pt.y)) continue;
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  if (!isFinite(minX)) return paths;

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const pad = 8;
  const scale = Math.min(
    (targetW - pad * 2) / boxW,
    (targetH - pad * 2) / boxH,
  );
  const offsetX = (targetW - boxW * scale) / 2;
  const offsetY = (targetH - boxH * scale) / 2;

  return paths.map((path) => ({
    ...path,
    strokeWidth: path.strokeWidth * Math.max(0.8, Math.min(2.2, scale * 0.3)),
    points: path.points.map((pt) => ({
      x: (pt.x - minX) * scale + offsetX,
      y: (pt.y - minY) * scale + offsetY,
    })),
  }));
}

function PosterCard({
  item,
  onPress,
  onLongPress,
  currentUserId,
}: {
  item: PosterEntry;
  onPress: () => void;
  onLongPress: () => void;
  currentUserId: string | null;
}) {
  const payload = parseAnnotationPayload(item.drawingData as unknown);
  const paths = payload.paths;
  const stickers = payload.stickers;
  const musicStickers = payload.musicStickers;
  const normalizedPaths = normalizePathsForCard(paths, CARD_W, CARD_H - 44);
  const totalAnnotations =
    normalizedPaths.length + stickers.length + musicStickers.length;

  return (
    <TouchableOpacity
      style={[styles.card, isTeam && styles.cardTeam]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {stickers.map((sticker) => {
        const sizePx = Math.max(
          24,
          Math.min(CARD_W * 0.6, sticker.size * CARD_W),
        );
        const x = Math.max(
          0,
          Math.min(CARD_W - sizePx, sticker.x * CARD_W - sizePx / 2),
        );
        const y = Math.max(
          0,
          Math.min(
            CARD_IMAGE_H - sizePx,
            sticker.y * CARD_IMAGE_H - sizePx / 2,
          ),
        );
        return (
          <Image
            key={sticker.id}
            source={{ uri: sticker.uri }}
            style={[
              styles.cardSticker,
              { width: sizePx, height: sizePx, left: x, top: y },
            ]}
            resizeMode="contain"
          />
        );
      })}
      {musicStickers.map((music) => {
        const widthPx = Math.max(
          64,
          Math.min(CARD_W * 0.9, music.size * CARD_W),
        );
        const x = Math.max(
          0,
          Math.min(CARD_W - widthPx, music.x * CARD_W - widthPx / 2),
        );
        const y = Math.max(
          0,
          Math.min(CARD_IMAGE_H - 24, music.y * CARD_IMAGE_H - 12),
        );
        return (
          <View
            key={music.id}
            style={[styles.musicSticker, { left: x, top: y, width: widthPx }]}
          >
            <Ionicons name="musical-note" size={10} color="#fff" />
            <Text style={styles.musicStickerText} numberOfLines={1}>
              {music.title}
            </Text>
          </View>
        );
      })}
      {normalizedPaths.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={CARD_W} height={CARD_IMAGE_H}>
            {normalizedPaths.map((p, i) => (
              <Path
                key={i}
                d={pathsToD(p.points)}
                stroke={p.color}
                strokeWidth={p.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        </View>
      )}

      {/* Badge adnotări */}
      {totalAnnotations > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✏️ {totalAnnotations}</Text>
        </View>
      )}

      {/* Badge echipă */}
      {isTeam && (
        <View style={styles.teamBadge}>
          <Text style={styles.teamBadgeText}>👥</Text>
        </View>
      )}

      <BlurView intensity={60} tint="dark" style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString("ro-RO")}
          {isTeam ? " · echipă" : ""}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [posters, setPosters] = useState<PosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    id: string;
    title: string;
  }>({
    visible: false,
    id: "",
    title: "",
  });
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      // Obține userId curent
      import("./lib/supabase").then(({ supabase }) => {
        supabase.auth.getSession().then(({ data }) => {
          setCurrentUserId(data.session?.user?.id ?? null);
        });
      });

      syncPostersFromSupabase().finally(() => {
        getAllPosters().then((all) => {
          const sorted = [...all].sort((a, b) => {
            const aHasDrawing = a.drawingData !== "[]" && a.drawingData !== "";
            const bHasDrawing = b.drawingData !== "[]" && b.drawingData !== "";
            if (aHasDrawing && !bHasDrawing) return -1;
            if (!aHasDrawing && bHasDrawing) return 1;
            return b.createdAt - a.createdAt;
          });
          setPosters(sorted);
          setLoading(false);
        });
      });
    }, []),
  );

  const handleDeleteRequest = useCallback((id: string, title: string) => {
    setDeleteModal({ visible: true, id, title });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ visible: false, id: "", title: "" });
  }, []);

  const confirmDelete = useCallback(async () => {
    const posterId = deleteModal.id;
    if (!posterId) {
      closeDeleteModal();
      return;
    }
    await deletePoster(posterId);
    setPosters((prev) => prev.filter((p) => p.id !== posterId));
    closeDeleteModal();
  }, [deleteModal.id, closeDeleteModal]);

  // Număr afișe proprii vs echipă
  const myPosters = posters.filter(
    (p) => !p.isTeamPoster || p.ownerId === currentUserId,
  ).length;
  const teamPosters = posters.filter(
    (p) => p.isTeamPoster && p.ownerId !== currentUserId,
  ).length;

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextMain}>GLITCH_</Text>
            <Text style={styles.logoTextSub}>TAG</Text>
          </View>
          <Text style={styles.headerSub}>POSTER_FEED</Text>
        </BlurView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : posters.length === 0 ? (
          <View style={styles.center}>
            <BlurView intensity={80} tint="dark" style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>NO_SIGNAL</Text>
              <Text style={styles.emptySubtitle}>
                No posters detected.{"\n"}Go to SCAN to tag your first target.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/scan")}
              >
                <Text style={styles.emptyBtnText}>INITIALIZE SCAN</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        ) : (
          <FlatList
            data={posters}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {myPosters} MY_TARGET{myPosters !== 1 ? "S" : ""}
                  {teamPosters > 0 ? `  ·  👥 ${teamPosters} TEAM` : ""}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <PosterCard
                item={item}
                currentUserId={currentUserId}
                onPress={() =>
                  router.push({ pathname: "/[id]", params: { id: item.id } })
                }
                onLongPress={() => handleDeleteRequest(item.id, item.title)}
              />
            )}
          />
        )}

        {/* Modal delete */}
        <Modal visible={deleteModal.visible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>FEED</Text>
                <Text style={styles.alertHeaderTextSub}> STATUS</Text>
              </View>
              <View style={styles.alertIconCircle}>
                <Text style={styles.alertIconText}>!</Text>
              </View>
              <Text style={styles.alertTitle}>DELETE POSTER</Text>
              <Text style={styles.alertMessage}>
                Remove "{deleteModal.title}" from the system?
              </Text>
              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.alertCancelButton}
                  onPress={closeDeleteModal}
                >
                  <Text style={styles.alertCancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.alertDeleteButton}
                  onPress={confirmDelete}
                >
                  <Text style={styles.alertDeleteButtonText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>

        <BottomNav activeTab="feed" />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  emptyBox: {
    margin: 30,
    padding: 35,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
    overflow: "hidden",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "bold", letterSpacing: 2 },
  listHeader: { paddingHorizontal: CARD_GAP, paddingTop: 16, paddingBottom: 8 },
  listHeaderText: { color: "#444", fontSize: 11, letterSpacing: 2 },
  grid: { paddingBottom: 100 },
  row: { paddingHorizontal: CARD_GAP, gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
    backgroundColor: "#111",
  },
  cardTeam: {
    borderColor: "rgba(0,200,100,0.4)",
  },
  cardImage: { width: CARD_W, height: CARD_H - 44 },
  cardSticker: { position: "absolute" },
  musicSticker: {
    position: "absolute",
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(109,40,217,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  musicStickerText: { color: "#fff", fontSize: 9, fontWeight: "700", flex: 1 },
  cardFooter: {
    height: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
  },
  cardDate: { color: "#555", fontSize: 10, marginTop: 2 },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,122,255,0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  teamBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,180,80,0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  teamBadgeText: { fontSize: 12 },
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
    borderColor: "rgba(0,122,255,0.4)",
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
  },
  alertIconCircle: {
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
  alertIconText: { color: "#ef4444", fontSize: 24, fontWeight: "bold" },
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
  alertActions: { width: "100%", flexDirection: "row", gap: 10 },
  alertCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  alertCancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  alertDeleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  alertDeleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
