import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { computeHash, isSamePosterAsync } from "./lib/phash";
import {
  deletePoster,
  generateId,
  getAllPosters,
  savePoster,
} from "./lib/storage";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("Analizez afișul...");
  const [facing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const handleCapture = useCallback(async () => {
    console.log("📸 handleCapture apelat");

    if (!cameraRef.current) {
      console.log("❌ Camera ref null");
      return;
    }
    if (processing) {
      console.log("❌ Processing în curs, ignorat");
      return;
    }

    setProcessing(true);
    setProcessingText("Capturez imaginea...");

    try {
      console.log("📷 Încerc să fac poza...");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      console.log("📷 Poza făcută:", photo?.uri);

      if (!photo?.uri) throw new Error("Nu s-a putut captura fotografia.");

      const destDir = FileSystem.documentDirectory + "posters/";
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = destDir + `poster_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: photo.uri, to: destUri });
      console.log("💾 Poza copiată la:", destUri);

      setProcessingText("Calculez hash-ul...");
      const hash = await computeHash(destUri);
      console.log("🔑 Hash calculat, lungime:", hash?.length);

      setProcessingText("Recunosc afișul...");
      const allPosters = await getAllPosters();
      console.log("📋 Afișe în storage:", allPosters.length);
      allPosters.forEach((p) =>
        console.log("  - ID:", p.id, "| Hash length:", p.hash?.length),
      );

      let duplicate = null;
      for (const poster of allPosters) {
        console.log(`🔍 Compar cu: ${poster.id}`);
        const same = await isSamePosterAsync(poster.hash, hash);
        console.log(`➡️ Rezultat: ${same}`);
        if (same) {
          duplicate = poster;
          break;
        }
      }

      console.log("🎯 Duplicat:", duplicate?.id ?? "niciunul");

      if (duplicate) {
        Alert.alert(
          "🎨 AFIȘ RECUNOSCUT",
          `Am găsit "${duplicate.title}" în feed-ul tău!\nCe vrei să faci cu el?`,
          [
            {
              text: "✏️ Editează",
              onPress: async () => {
                await FileSystem.deleteAsync(destUri, { idempotent: true });
                router.push({
                  pathname: "/[id]",
                  params: { id: duplicate!.id },
                });
              },
            },
            {
              text: "🗑️ Șterge",
              style: "destructive",
              onPress: () => {
                Alert.alert(
                  "Confirmi ștergerea?",
                  `"${duplicate!.title}" va fi eliminat din feed.`,
                  [
                    { text: "Anulează", style: "cancel" },
                    {
                      text: "Șterge",
                      style: "destructive",
                      onPress: async () => {
                        await FileSystem.deleteAsync(destUri, {
                          idempotent: true,
                        });
                        await deletePoster(duplicate!.id);
                        Alert.alert(
                          "✅ Șters",
                          "Afișul a fost eliminat din feed.",
                        );
                      },
                    },
                  ],
                );
              },
            },
            {
              text: "Anulează",
              style: "cancel",
              onPress: async () => {
                await FileSystem.deleteAsync(destUri, { idempotent: true });
              },
            },
          ],
        );
      } else {
        const id = generateId();
        await savePoster({
          id,
          imageUri: destUri,
          hash,
          drawingData: "[]",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          title: `Afiș ${new Date().toLocaleDateString("ro-RO")}`,
        });
        console.log("💾 Afiș nou salvat cu id:", id);

        Alert.alert(
          "📌 AFIȘ NOU SALVAT",
          "Afișul a fost adăugat în feed. Vrei să adaugi adnotări?",
          [
            {
              text: "✏️ Desenează",
              onPress: () => router.push({ pathname: "/[id]", params: { id } }),
            },
            {
              text: "📋 Mergi la Feed",
              onPress: () => router.push("/feed"),
            },
          ],
        );
      }
    } catch (err: any) {
      console.log("❌ Eroare:", err?.message);
      Alert.alert("Eroare", err?.message ?? "Ceva nu a funcționat.");
    } finally {
      setProcessing(false);
      setProcessingText("Analizez afișul...");
    }
  }, [processing, router]);

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

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <Text style={styles.topLabel}>SCAN_TARGET</Text>
          <View style={styles.scanFrame}>
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
            {processing ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f0f0f",
  },
  permText: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 15,
  },
  permBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  topLabel: {
    color: "#007AFF",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 16,
    fontWeight: "700",
  },
  scanFrame: {
    width: 260,
    height: 340,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 16,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 32,
    letterSpacing: 0.5,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#007AFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  controls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0,122,255,0.15)",
    borderWidth: 3,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
  },
});
