import { BlurView } from "expo-blur";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    computeHash,
    isExactPosterDuplicate,
    posterSimilarity,
} from "./lib/phash_v3";
import {
    deletePoster,
    generateId,
    getAllPosters,
    savePoster,
} from "./lib/storage";

const FRAME_W = 260;
const FRAME_H = 340;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.72;
const VERY_SIMILAR_THRESHOLD = 0.62;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("Analizez afișul...");
  const [duplicateModal, setDuplicateModal] = useState<{
    visible: boolean;
    posterId: string;
    posterTitle: string;
    tempUri: string;
  }>({ visible: false, posterId: "", posterTitle: "", tempUri: "" });
  const [newPosterModal, setNewPosterModal] = useState<{
    visible: boolean;
    posterId: string;
    posterTitle: string;
    similarPosterTitle: string;
    similarityScore: number;
  }>({
    visible: false,
    posterId: "",
    posterTitle: "",
    similarPosterTitle: "",
    similarityScore: 0,
  });
  const [facing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // ── Duplicate modal handlers ────────────────────────────────────────────

  const closeDuplicateModal = useCallback(() => {
    setDuplicateModal({ visible: false, posterId: "", posterTitle: "", tempUri: "" });
  }, []);

  const handleDuplicateEdit = useCallback(async () => {
    const { posterId, tempUri } = duplicateModal;
    if (!posterId) return;
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    closeDuplicateModal();
    router.push({ pathname: "/[id]", params: { id: posterId } });
  }, [duplicateModal, closeDuplicateModal, router]);

  const handleDuplicateDelete = useCallback(async () => {
    const { posterId, tempUri } = duplicateModal;
    if (!posterId) return;
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    await deletePoster(posterId);
    closeDuplicateModal();
    router.push("/feed");
  }, [duplicateModal, closeDuplicateModal, router]);

  const handleDuplicateCancel = useCallback(async () => {
    const { tempUri } = duplicateModal;
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    closeDuplicateModal();
    router.push("/feed");
  }, [duplicateModal, closeDuplicateModal, router]);

  // ── New poster modal handlers ───────────────────────────────────────────

  const closeNewPosterModal = useCallback(() => {
    setNewPosterModal({
      visible: false,
      posterId: "",
      posterTitle: "",
      similarPosterTitle: "",
      similarityScore: 0,
    });
  }, []);

  const handleNewPosterAnnotate = useCallback(() => {
    const { posterId } = newPosterModal;
    if (!posterId) return;
    closeNewPosterModal();
    router.push({ pathname: "/[id]", params: { id: posterId } });
  }, [newPosterModal, closeNewPosterModal, router]);

  const handleNewPosterFeed = useCallback(() => {
    closeNewPosterModal();
    router.push("/feed");
  }, [closeNewPosterModal, router]);

  const handleNewPosterScanAnother = useCallback(() => {
    closeNewPosterModal();
  }, [closeNewPosterModal]);

  // ── Capture ─────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || processing) return;

    setProcessing(true);
    setProcessingText("Capturez imaginea...");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) throw new Error("Nu s-a putut captura fotografia.");

      const screen = Dimensions.get("window");
      const screenW = screen.width;
      const screenH = screen.height;
      const photoW = photo.width ?? screenW;
      const photoH = photo.height ?? screenH;

      const scaleX = photoW / screenW;
      const scaleY = photoH / screenH;

      const cropX = Math.floor(((screenW - FRAME_W) / 2) * scaleX);
      const cropY = Math.floor(((screenH - FRAME_H) / 2) * scaleY);
      const cropW = Math.floor(FRAME_W * scaleX);
      const cropH = Math.floor(FRAME_H * scaleY);

      setProcessingText("Procesez imaginea...");
      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const destDir = FileSystem.documentDirectory + "posters/";
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = destDir + `poster_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: cropped.uri, to: destUri });

      setProcessingText("Calculez hash-ul...");
      const hash = await computeHash(destUri);

      setProcessingText("Recunosc afișul...");
      const allPosters = await getAllPosters();
      let exactDuplicate: (typeof allPosters)[number] | null = null;
      let similarCandidate: (typeof allPosters)[number] | null = null;
      let bestScore = 0;

      for (const poster of allPosters) {
        let candidateHash = poster.hash;

        // Migrează hash-urile vechi la formatul nou pentru comparații stabile.
        if (!candidateHash.startsWith("v4|")) {
          try {
            candidateHash = await computeHash(poster.imageUri);
            await savePoster({
              ...poster,
              hash: candidateHash,
              updatedAt: Date.now(),
            });
          } catch {
            candidateHash = poster.hash;
          }
        }

        const exactNow = isExactPosterDuplicate(candidateHash, hash);
        if (exactNow) {
          exactDuplicate = poster;
          break;
        }

        const score = posterSimilarity(candidateHash, hash);
        if (score > bestScore) {
          bestScore = score;
          similarCandidate = poster;
        }
      }

      // 3 stări: duplicat (exact sau aproape identic), foarte asemănător, sau nou.
      const similarityDuplicate =
        exactDuplicate === null &&
        similarCandidate !== null &&
        bestScore >= DUPLICATE_SIMILARITY_THRESHOLD;

      const isDuplicate = exactDuplicate !== null || similarityDuplicate;
      const duplicateTarget = exactDuplicate ?? (similarityDuplicate ? similarCandidate : null);

      const isVerySimilar =
        similarCandidate !== null &&
        bestScore >= VERY_SIMILAR_THRESHOLD &&
        bestScore < DUPLICATE_SIMILARITY_THRESHOLD &&
        !isDuplicate;

      if (isDuplicate && duplicateTarget) {
        setDuplicateModal({
          visible: true,
          posterId: duplicateTarget.id,
          posterTitle: duplicateTarget.title,
          tempUri: destUri,
        });
      } else {
        const id = generateId();
        const title = `Afiș ${new Date().toLocaleDateString("ro-RO")}`;
        await savePoster({
          id,
          imageUri: destUri,
          hash,
          drawingData: "[]",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          title,
        });
        setNewPosterModal({
          visible: true,
          posterId: id,
          posterTitle: title,
          similarPosterTitle:
            isVerySimilar && similarCandidate ? similarCandidate.title : "",
          similarityScore: isVerySimilar ? bestScore : 0,
        });
      }
    } catch (err: any) {
      Alert.alert("Eroare", err?.message ?? "Ceva nu a funcționat.");
    } finally {
      setProcessing(false);
      setProcessingText("Analizez afișul...");
    }
  }, [processing, router]);

  // ── Permission screens ──────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          Aplicația are nevoie de acces la cameră pentru a scana afișe.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Acordă permisiune</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator color="#007AFF" size="large" />
                <Text style={styles.processingText}>{processingText}</Text>
              </View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.topLabel}>SCAN_TARGET</Text>
          <Text style={styles.hint}>
            Centrează afișul în cadru și apasă butonul
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureBtn, processing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={processing}
          >
            {processing
              ? <ActivityIndicator color="#007AFF" size="small" />
              : <View style={styles.captureInner} />
            }
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Modal duplicat */}
      <Modal visible={duplicateModal.visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
            <View style={styles.alertHeaderBox}>
              <Text style={styles.alertHeaderTextMain}>SCAN</Text>
              <Text style={styles.alertHeaderTextSub}> STATUS</Text>
            </View>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.alertTitle}>AFIȘ RECUNOSCUT</Text>
            <Text style={styles.alertMessage}>
              Am găsit "{duplicateModal.posterTitle}". Ce vrei să faci?
            </Text>
            <TouchableOpacity style={styles.alertButton} onPress={handleDuplicateEdit}>
              <Text style={styles.alertButtonText}>✏️ EDITEAZĂ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertDeleteButton} onPress={handleDuplicateDelete}>
              <Text style={styles.alertButtonText}>🗑️ ȘTERGE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertCancelButton} onPress={handleDuplicateCancel}>
              <Text style={styles.alertCancelText}>ANULEAZĂ</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Modal afiș nou */}
      <Modal visible={newPosterModal.visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
            <View style={styles.alertHeaderBox}>
              <Text style={styles.alertHeaderTextMain}>SCAN</Text>
              <Text style={styles.alertHeaderTextSub}> STATUS</Text>
            </View>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.alertTitle}>AFIȘ NOU SALVAT</Text>
            <Text style={styles.alertMessage}>
              {newPosterModal.similarPosterTitle
                ? `"${newPosterModal.posterTitle}" a fost salvat ca nou. Seamănă cu "${newPosterModal.similarPosterTitle}" (${Math.round(newPosterModal.similarityScore * 100)}%).`
                : `"${newPosterModal.posterTitle}" a fost adăugat în feed.`}
            </Text>
            <TouchableOpacity style={styles.alertButton} onPress={handleNewPosterAnnotate}>
              <Text style={styles.alertButtonText}>✏️ ADNOTEAZĂ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertNeutralButton} onPress={handleNewPosterFeed}>
              <Text style={styles.alertButtonText}>📋 FEED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertCancelButton} onPress={handleNewPosterScanAnother}>
              <Text style={styles.alertCancelText}>📷 SCANEAZĂ ALT AFIȘ</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const OVERLAY_COLOR = "rgba(0,0,0,0.55)";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 24, backgroundColor: "#0f0f0f",
  },
  permText: { color: "#ccc", textAlign: "center", marginBottom: 16, fontSize: 15 },
  permBtn: { backgroundColor: "#007AFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  overlayTop: { width: "100%", backgroundColor: OVERLAY_COLOR, flex: 1 },
  overlayMiddle: { flexDirection: "row", height: FRAME_H },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: {
    flex: 1, width: "100%", backgroundColor: OVERLAY_COLOR,
    alignItems: "center", justifyContent: "flex-start", paddingTop: 16,
  },
  frame: {
    width: FRAME_W, height: FRAME_H,
    position: "relative", alignItems: "center", justifyContent: "center",
  },
  topLabel: { color: "#007AFF", fontSize: 11, letterSpacing: 3, fontWeight: "700", marginBottom: 8 },
  hint: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", paddingHorizontal: 32, letterSpacing: 0.5 },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#007AFF" },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center", gap: 12,
  },
  processingText: { color: "#007AFF", fontSize: 13, fontWeight: "600", letterSpacing: 1 },
  controls: { position: "absolute", bottom: 50, width: "100%", alignItems: "center" },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(0,122,255,0.15)",
    borderWidth: 3, borderColor: "#007AFF",
    alignItems: "center", justifyContent: "center",
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#007AFF" },
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
  alertTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  alertMessage: { color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  alertButton: {
    backgroundColor: "#007AFF", width: "100%",
    paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 10,
  },
  alertDeleteButton: {
    backgroundColor: "#ef4444", width: "100%",
    paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 10,
  },
  alertNeutralButton: {
    backgroundColor: "rgba(0,122,255,0.75)", width: "100%",
    paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 10,
  },
  alertCancelButton: {
    width: "100%", paddingVertical: 12, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)",
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  alertCancelText: { color: "#ddd", fontWeight: "700", letterSpacing: 1 },
});