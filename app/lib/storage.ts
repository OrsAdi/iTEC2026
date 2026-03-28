import AsyncStorage from "@react-native-async-storage/async-storage";
import { posterSimilarity } from "./phash";

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

async function getIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export async function savePoster(entry: PosterEntry): Promise<void> {
  const ids = await getIndex();
  if (!ids.includes(entry.id)) {
    ids.push(entry.id);
    await setIndex(ids);
  }
  await AsyncStorage.setItem(PREFIX + entry.id, JSON.stringify(entry));
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

export async function updateDrawing(id: string, drawingData: string): Promise<void> {
  const entry = await getPoster(id);
  if (!entry) return;
  entry.drawingData = drawingData;
  entry.updatedAt = Date.now();
  await AsyncStorage.setItem(PREFIX + id, JSON.stringify(entry));
}

export async function deletePoster(id: string): Promise<void> {
  const ids = await getIndex();
  await setIndex(ids.filter((i) => i !== id));
  await AsyncStorage.removeItem(PREFIX + id);
}

export async function findDuplicate(hash: string): Promise<PosterEntry | null> {
  const all = await getAllPosters();
  return all.find((p) => posterSimilarity(p.hash, hash) >= 0.9) ?? null;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
