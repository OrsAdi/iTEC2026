import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import BottomNav from "./components/BottomNav"; // Corect (caută în folderul app/components)
import {
  deletePoster,
  DrawPath,
  getAllPosters,
  PosterEntry,
} from "./lib/storage"; // Corect

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - CARD_GAP * 3) / 2;
const CARD_H = CARD_W * 1.3;

function pathsToD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ")
  );
}

function PosterCard({
  item,
  onPress,
  onLongPress,
}: {
  item: PosterEntry;
  onPress: () => void;
  onLongPress: () => void;
}) {
  let paths: DrawPath[] = [];
  try {
    paths = JSON.parse(item.drawingData);
  } catch {}

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {paths.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={CARD_W} height={CARD_H - 44}>
            {paths.map((p, i) => (
              <Path
                key={i}
                d={pathsToD(p.points)}
                stroke={p.color}
                strokeWidth={p.strokeWidth * 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        </View>
      )}

      {paths.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✏️ {paths.length}</Text>
        </View>
      )}

      <BlurView intensity={60} tint="dark" style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString("ro-RO")}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [posters, setPosters] = useState<PosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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
    }, []),
  );

  const handleDelete = useCallback((id: string, title: string) => {
    Alert.alert("DELETE_POSTER", `Remove "${title}" from the system?`, [
      { text: "CANCEL", style: "cancel" },
      {
        text: "DELETE",
        style: "destructive",
        onPress: async () => {
          await deletePoster(id);
          setPosters((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000",
        }}
        style={styles.background}
      >
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTextMain}>GLITCH_</Text>
            <Text style={styles.logoTextSub}>TAG</Text>
          </View>
          <Text style={styles.headerSub}>POSTER_FEED</Text>
        </BlurView>

        {/* Content */}
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
                  {posters.length} TARGET{posters.length !== 1 ? "S" : ""}
                  _TAGGED
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <PosterCard
                item={item}
                onPress={() =>
                  router.push({ pathname: "/[id]", params: { id: item.id } })
                }
                onLongPress={() => handleDelete(item.id, item.title)}
              />
            )}
          />
        )}

        {/* Bottom Nav */}
        <BottomNav activeTab="feed" />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: "#000" },
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
  cardImage: { width: CARD_W, height: CARD_H - 44 },
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
});
