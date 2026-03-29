import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { isSamePoster as isSamePosterLegacy } from "./phash";
import { isExactPosterDuplicate } from "./phash_v3";
import { supabase } from "./supabase";

export interface PosterEntry {
  id: string;
  imageUri: string;
  hash: string;
  drawingData: string;
  createdAt: number;
  updatedAt: number;
  title: string;
}

export interface DrawPath {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

const INDEX_KEY = "poster_index";
const PREFIX = "poster:";

// ─── Local helpers ─────────────────────────────────────────────────────────

async function getIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

// ─── Supabase helpers ──────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function uploadImageToSupabase(
  localUri: string,
  posterId: string
): Promise<string | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const filePath = `${userId}/${posterId}.jpg`;
    const { error } = await supabase.storage
      .from("posters")
      .upload(filePath, decode(base64), {
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

function decode(base64: string): Uint8Array {
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
  return new Uint8Array(bytes);
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function savePoster(entry: PosterEntry): Promise<void> {
  // Salvează local
  const ids = await getIndex();
  const alreadyExists = ids.includes(entry.id);
  if (!ids.includes(entry.id)) {
    ids.push(entry.id);
    await setIndex(ids);
  }
  await AsyncStorage.setItem(PREFIX + entry.id, JSON.stringify(entry));

  // Sincronizează cu Supabase în background
  const userId = await getCurrentUserId();
  if (!userId) return;

  const isRemoteImage = /^https?:\/\//i.test(entry.imageUri);
  const shouldUploadOriginal = !alreadyExists && !isRemoteImage;
  const imageUrl = shouldUploadOriginal
    ? await uploadImageToSupabase(entry.imageUri, entry.id)
    : null;

  await supabase.from("posters").upsert({
    id: entry.id,
    user_id: userId,
    image_url: imageUrl ?? entry.imageUri,
    hash: entry.hash,
    drawing_data: entry.drawingData,
    title: entry.title,
    created_at: new Date(entry.createdAt).toISOString(),
    updated_at: new Date(entry.updatedAt).toISOString(),
  });
}

export async function getPoster(id: string): Promise<PosterEntry | null> {
  const raw = await AsyncStorage.getItem(PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export async function getAllPosters(): Promise<PosterEntry[]> {
  const ids = await getIndex();
  const entries = await Promise.all(ids.map((id) => getPoster(id)));
  return (entries.filter(Boolean) as PosterEntry[]).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function updateDrawing(
  id: string,
  drawingData: string
): Promise<void> {
  const entry = await getPoster(id);
  if (!entry) return;
  entry.drawingData = drawingData;
  entry.updatedAt = Date.now();
  await AsyncStorage.setItem(PREFIX + id, JSON.stringify(entry));

  await supabase
    .from("posters")
    .update({
      drawing_data: drawingData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function resetPosterToOriginal(id: string): Promise<string | null> {
  const entry = await getPoster(id);
  if (!entry) return null;

  const userId = await getCurrentUserId();
  if (!userId) {
    entry.drawingData = "[]";
    entry.updatedAt = Date.now();
    await AsyncStorage.setItem(PREFIX + id, JSON.stringify(entry));
    return entry.imageUri;
  }

  const originalPath = `${userId}/${id}.jpg`;
  const { data } = supabase.storage.from("posters").getPublicUrl(originalPath);
  const originalImageUrl = data.publicUrl;

  entry.drawingData = "[]";
  entry.imageUri = originalImageUrl;
  entry.updatedAt = Date.now();
  await AsyncStorage.setItem(PREFIX + id, JSON.stringify(entry));

  await supabase
    .from("posters")
    .update({
      drawing_data: "[]",
      image_url: originalImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return originalImageUrl;
}

export async function deletePoster(id: string): Promise<void> {
  const ids = await getIndex();
  await setIndex(ids.filter((i) => i !== id));
  await AsyncStorage.removeItem(PREFIX + id);

  const userId = await getCurrentUserId();
  if (userId) {
    await supabase.from("posters").delete().eq("id", id);
    await supabase.storage.from("posters").remove([`${userId}/${id}.jpg`]);
  }
}

export async function syncPostersFromSupabase(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("posters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return;

    const ids: string[] = [];
    for (const poster of data) {
      const localEntry = await getPoster(poster.id);
      const remoteUpdatedAt = new Date(poster.updated_at).getTime();

      // Păstrează local dacă e mai nou
      if (localEntry && localEntry.updatedAt > remoteUpdatedAt) {
        ids.push(localEntry.id);
        await AsyncStorage.setItem(PREFIX + localEntry.id, JSON.stringify(localEntry));
        continue;
      }

      const normalizedDrawingData =
        typeof poster.drawing_data === "string"
          ? poster.drawing_data
          : JSON.stringify(poster.drawing_data ?? []);

      const entry: PosterEntry = {
        id: poster.id,
        imageUri: poster.image_url,
        // ← FIX: păstrează hash-ul local original dacă există
        // hash-ul trebuie să rămână cel calculat pe imaginea originală
        // nu pe cea adnotată uploadată în Supabase
        hash: localEntry?.hash ?? poster.hash,
        drawingData: normalizedDrawingData,
        title: poster.title,
        createdAt: new Date(poster.created_at).getTime(),
        updatedAt: remoteUpdatedAt,
      };
      ids.push(entry.id);
      await AsyncStorage.setItem(PREFIX + entry.id, JSON.stringify(entry));
    }
    await setIndex(ids);
  } catch (e) {
    console.log("Sync error:", e);
  }
}
export async function findDuplicate(hash: string): Promise<PosterEntry | null> {
  const all = await getAllPosters();
  return (
    all.find(
      (p) =>
        isExactPosterDuplicate(p.hash, hash) ||
        isSamePosterLegacy(p.hash, hash)
    ) ?? null
  );
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
