import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
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

import type { PosterEntry } from "./lib/storage";
import {
    deletePoster,
    DrawPath,
    getPoster,
    updateDrawing
} from "./lib/storage";

const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FFFFFF",
  "#000000",
];
const STROKE_WIDTHS = [2, 4, 8, 14];
const OPENAI_IMAGE_API_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const GIF_OPTIONS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2xqN2I0c2F2dWN4eXV6dDZ0aWh6bWI1Y2x4dnF0a2YwdW9qdjNnMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ICOgUNjpvO0PC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHVmNnM2MzVibnNmbWwwNDUydDV4N2FwNTA2N2RoMjlpczhqN2d0dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlNaQ6gWfllcjDO/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2xwbHRiYjI1ZW5tOHVhZm5uN2MyZ2Q3c2l4NWIzMmVhM2NncTBpYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnN3d2FscDd5d3J2M3RlcWl6a2s0djNyb2xud3NrdXN5ejF5MjVwNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fxsqOYnIMEefC/giphy.gif",
  "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
  "https://media.giphy.com/media/3oriO7A7bt1wsEP4cw/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
  "https://media.giphy.com/media/3og0IPxMM0erATueVW/giphy.gif",
  "https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/3orieUe6ejxSFxYCXe/giphy.gif",
  "https://media.giphy.com/media/l0MYB8Ory7Hqefo9a/giphy.gif",
  "https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif",
  "https://media.giphy.com/media/3o7TKsQ8UQH7Q4n2lq/giphy.gif",
  "https://media.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.gif",
  "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
];
const STICKER_OPTIONS = [
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a5.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f680.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f389.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f381.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f496.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f31f.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f920.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4af.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3c6.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3a7.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b5.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f984.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f47b.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60e.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4f8.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3a8.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f393.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9e0.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png",
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f31a.png",
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
  musicStickers: MusicSticker[];
  backgroundMusic: BackgroundMusic | null;
};

type BackgroundMusic = {
  title: string;
  uri: string;
  startSec: number;
  durationSec: number;
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

type SongSearchResult = {
  id: string;
  title: string;
  artist: string;
  previewUrl: string;
  durationSec: number;
};

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url);
}

async function searchSongsByName(query: string): Promise<SongSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=12`
  );
  if (!response.ok) {
    throw new Error("Search request failed");
  }

  const json = await response.json();
  const list = Array.isArray(json?.results) ? json.results : [];
  return list
    .filter((item: any) => typeof item?.previewUrl === "string" && item.previewUrl.length > 0)
    .map((item: any) => {
      const ms = Number(item.trackTimeMillis ?? 30000);
      return {
        id: String(item.trackId ?? `${item.previewUrl}_${Math.random().toString(36).slice(2, 7)}`),
        title: String(item.trackName ?? "Track"),
        artist: String(item.artistName ?? "Unknown artist"),
        previewUrl: String(item.previewUrl),
        durationSec: Math.max(3, Math.min(30, Math.floor(ms / 1000) || 8)),
      } as SongSearchResult;
    });
}

function pathsToD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function extractMetaImageUrl(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match?.[1]) return match[1].replace(/&amp;/g, "&");
  }
  return null;
}

async function resolveGifUrl(input: string): Promise<string | null> {
  const candidate = normalizeHttpUrl(input);
  if (/\.(gif|webp|png|jpe?g)(\?|#|$)/i.test(candidate)) {
    return candidate;
  }

  try {
    const head = await fetch(candidate, { method: "HEAD" });
    const type = (head.headers.get("content-type") || "").toLowerCase();
    if (type.startsWith("image/")) {
      return head.url || candidate;
    }
  } catch {
    // Continue with HTML inspection fallback.
  }

  try {
    const response = await fetch(candidate, { method: "GET" });
    const type = (response.headers.get("content-type") || "").toLowerCase();
    if (type.startsWith("image/")) {
      return response.url || candidate;
    }

    const html = await response.text();
    const fromMeta = extractMetaImageUrl(html);
    if (fromMeta) {
      return normalizeHttpUrl(fromMeta);
    }

    // Giphy page fallback: https://giphy.com/gifs/<slug>-<id>
    if (/giphy\.com/i.test(candidate)) {
      const path = new URL(candidate).pathname;
      const parts = path.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || "";
      const id = last.split("-").pop();
      if (id && /^[A-Za-z0-9]+$/.test(id)) {
        return `https://media.giphy.com/media/${id}/giphy.gif`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function extractGeneratedImageUri(payload: any): string | null {
  const first = payload?.data?.[0];
  if (!first) return null;
  if (typeof first.url === "string" && first.url.length > 0) {
    return first.url;
  }
  if (typeof first.b64_json === "string" && first.b64_json.length > 0) {
    return `data:image/png;base64,${first.b64_json}`;
  }
  return null;
}

function buildFallbackAiStickerUrl(prompt: string): string {
  const safePrompt = encodeURIComponent(
    `clean sticker style, isolated object, no text, transparent background look, ${prompt}`
  );
  const seed = Date.now();
  return `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
}

async function generateStickerWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Cheia Gemini lipseste.");
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a single sticker-style image with transparent background look, centered subject, no text: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Gemini nu a putut genera stickerul.";
    throw new Error(String(message));
  }

  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const b64 = part?.inlineData?.data;
      const mime = part?.inlineData?.mimeType || "image/png";
      if (typeof b64 === "string" && b64.length > 0) {
        return `data:${mime};base64,${b64}`;
      }
    }
  }

  throw new Error("Gemini a raspuns fara imagine.");
}

async function materializeStickerUri(rawUri: string): Promise<string> {
  const uri = rawUri.trim();
  if (!uri) return uri;
  if (uri.startsWith("file://")) return uri;

  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!cacheDir) return uri;

  const dataUriMatch = uri.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUriMatch?.[2]) {
    try {
      const extRaw = dataUriMatch[1].toLowerCase();
      const ext = extRaw === "jpeg" ? "jpg" : extRaw;
      const filePath = `${cacheDir}ai_sticker_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(filePath, dataUriMatch[2], {
        encoding: FileSystem.EncodingType.Base64,
      });
      return filePath;
    } catch {
      return uri;
    }
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      const filePath = `${cacheDir}ai_sticker_${Date.now()}.png`;
      const result = await FileSystem.downloadAsync(uri, filePath);
      if (result?.uri) return result.uri;
    } catch {
      return uri;
    }
  }

  return uri;
}


function parseAnnotationPayload(raw: unknown): AnnotationPayload {
  const empty: AnnotationPayload = { paths: [], stickers: [], musicStickers: [], backgroundMusic: null };

  if (Array.isArray(raw)) return { paths: raw as DrawPath[], stickers: [], musicStickers: [], backgroundMusic: null };
  if (typeof raw !== "string") return empty;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { paths: parsed as DrawPath[], stickers: [], musicStickers: [], backgroundMusic: null };

    if (parsed && typeof parsed === "object") {
      const paths = Array.isArray((parsed as any).paths)
        ? ((parsed as any).paths as DrawPath[])
        : [];
      const stickers = Array.isArray((parsed as any).stickers)
        ? ((parsed as any).stickers as GifSticker[])
        : [];
      const musicStickers = Array.isArray((parsed as any).musicStickers)
        ? ((parsed as any).musicStickers as MusicSticker[])
        : [];
      const bg = (parsed as any).backgroundMusic;
      const backgroundMusic =
        bg && typeof bg === "object" && typeof bg.uri === "string"
          ? {
            title: String(bg.title ?? "Track"),
            uri: String(bg.uri),
            startSec: Math.max(0, Number(bg.startSec ?? 0) || 0),
            durationSec: Math.max(3, Math.min(30, Number(bg.durationSec ?? 8) || 8)),
          }
          : null;

      return { paths, stickers, musicStickers, backgroundMusic };
    }

    return empty;
  } catch {
    return empty;
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
  const [musicPickerVisible, setMusicPickerVisible] = useState(false);
  const [gifUrlInput, setGifUrlInput] = useState("");
  const [aiStickerPromptInput, setAiStickerPromptInput] = useState("");
  const [aiStickerLoading, setAiStickerLoading] = useState(false);
  const [musicDurationInput, setMusicDurationInput] = useState("8");
  const [songQueryInput, setSongQueryInput] = useState("");
  const [songSearchLoading, setSongSearchLoading] = useState(false);
  const [songSearchResults, setSongSearchResults] = useState<SongSearchResult[]>([]);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusic | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [isStickerMode, setIsStickerMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [stickers, setStickers] = useState<GifSticker[]>([]);
  const [musicStickers, setMusicStickers] = useState<MusicSticker[]>([]);
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[]>([]);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [activeWidth, setActiveWidth] = useState(STROKE_WIDTHS[1]);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const activeColorRef = useRef(activeColor);
  const activeWidthRef = useRef(activeWidth);
  const openAiBillingBlockedRef = useRef(false);
  const viewShotRef = useRef<ViewShot>(null);
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const activeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);
  useEffect(() => {
    activeWidthRef.current = activeWidth;
  }, [activeWidth]);

  useEffect(() => {
    if (!id) return;
    getPoster(id).then((entry) => {
      if (entry) {
        setPoster(entry);
        const payload = parseAnnotationPayload(entry.drawingData as unknown);
        setPaths(payload.paths);
        setStickers(payload.stickers);
        setMusicStickers(payload.musicStickers);
        setBackgroundMusic(payload.backgroundMusic);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (stickers.length > 0 || musicStickers.length > 0) setIsStickerMode(true);
  }, [stickers.length, musicStickers.length]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(() => null);
  }, []);

  useEffect(() => {
    return () => {
      if (activeSoundRef.current) {
        activeSoundRef.current.unloadAsync().catch(() => null);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const startBackground = async () => {
      if (!backgroundMusic?.uri) {
        if (activeSoundRef.current) {
          await activeSoundRef.current.unloadAsync().catch(() => null);
          activeSoundRef.current = null;
        }
        return;
      }

      if (activeSoundRef.current) {
        await activeSoundRef.current.unloadAsync().catch(() => null);
        activeSoundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: backgroundMusic.uri },
        {
          shouldPlay: true,
          isLooping: true,
          positionMillis: Math.max(0, Math.floor(backgroundMusic.startSec * 1000)),
          volume: 1,
        }
      );

      if (cancelled) {
        await sound.unloadAsync().catch(() => null);
        return;
      }

      activeSoundRef.current = sound;
    };

    startBackground().catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [backgroundMusic]);

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
        setPaths((prev) => [
          ...prev,
          {
            points: completed,
            color: activeColorRef.current,
            strokeWidth: activeWidthRef.current,
          },
        ]);
      }
      currentPoints.current = [];
      setLivePoints([]);
    });

  const handleUndo = useCallback(
    () => setPaths((prev) => prev.slice(0, -1)),
    [],
  );

  const handleClear = useCallback(() => {
    setClearConfirmVisible(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setPaths([]);
    setStickers([]);
    setMusicStickers([]);
    setSelectedStickerId(null);
    setSelectedMusicId(null);
    setClearConfirmVisible(false);
  }, []);

  const appendSticker = useCallback(async (stickerUri: string) => {
    let materializedUri = stickerUri;
    try {
      materializedUri = await materializeStickerUri(stickerUri);
    } catch {
      materializedUri = stickerUri;
    }

    const newSticker: GifSticker = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      uri: materializedUri,
      x: 0.5,
      y: 0.5,
      size: 0.26,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setSelectedMusicId(null);
    setIsStickerMode(true);
    setGifPickerVisible(false);
    setGifUrlInput("");
    setAiStickerPromptInput("");
  }, []);

  const addGifSticker = useCallback(async (uri: string) => {
    const clean = uri.trim();
    if (!clean) return;

    const isDirectImage = /^data:image\//i.test(clean) || /\.(gif|webp|png|jpe?g)(\?|#|$)/i.test(clean);
    const resolved = isDirectImage ? normalizeHttpUrl(clean) : await resolveGifUrl(clean);
    if (!resolved) {
      Alert.alert("Link invalid", "Nu am putut extrage un GIF/sticker din acest link.");
      return;
    }
    await appendSticker(resolved);
  }, [appendSticker]);

  const handleGenerateAiSticker = useCallback(async () => {
    const prompt = aiStickerPromptInput.trim();
    if (!prompt) {
      Alert.alert("Missing prompt", "Type what sticker you want to generate.");
      return;
    }
    if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
      Alert.alert(
        "Cheie API lipsa",
        "Seteaza EXPO_PUBLIC_GEMINI_API_KEY sau EXPO_PUBLIC_OPENAI_API_KEY in config-ul proiectului."
      );
      return;
    }

    setAiStickerLoading(true);
    try {
      if (GEMINI_API_KEY) {
        try {
          const geminiUri = await generateStickerWithGemini(prompt);
          await appendSticker(geminiUri);
          return;
        } catch {
          // Continue with OpenAI or final fallback.
        }
      }

      if (OPENAI_API_KEY && !openAiBillingBlockedRef.current) {
        const response = await fetch(OPENAI_IMAGE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: `Create a clean sticker-style image with transparent background: ${prompt}`,
            size: "1024x1024",
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          const message = payload?.error?.message || "Nu am putut genera stickerul.";
          const code = String(payload?.error?.code || "");
          if (/billing_hard_limit_reached/i.test(code) || /billing hard limit has been reached/i.test(String(message))) {
            openAiBillingBlockedRef.current = true;
            throw new Error(`BILLING_LIMIT::${message}`);
          }
          throw new Error(String(message));
        }

        const imageUri = extractGeneratedImageUri(payload);
        if (!imageUri) {
          throw new Error("Raspuns invalid de la API-ul de imagini.");
        }

        await appendSticker(imageUri);
        return;
      }

      throw new Error("NO_PAID_PROVIDER");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nu am putut genera stickerul.";
      if (message.startsWith("BILLING_LIMIT::")) {
        const fallbackUrl = buildFallbackAiStickerUrl(prompt);
        await appendSticker(fallbackUrl);
        Alert.alert(
          "OpenAI limit atinsa",
          "Am folosit fallback generator pentru sticker ca sa poti continua."
        );
        return;
      }

      if (message === "NO_PAID_PROVIDER") {
        const fallbackUrl = buildFallbackAiStickerUrl(prompt);
        await appendSticker(fallbackUrl);
        return;
      }

      Alert.alert("Generare esuata", message);
    } finally {
      setAiStickerLoading(false);
    }
  }, [aiStickerPromptInput, appendSticker]);


  const setPosterBackgroundMusic = useCallback((uri: string, title: string, durationSec: number) => {
    const clean = uri.trim();
    if (!clean) return;
    if (isYouTubeUrl(clean)) {
      Alert.alert(
        "YouTube not supported for autoplay",
        "YouTube links cannot be used as audio-only here. Search by song name and select an audio result."
      );
      return;
    }
    setBackgroundMusic({
      title: title.trim() || "Track",
      uri: clean,
      startSec: 0,
      durationSec: Math.max(3, Math.min(30, durationSec || 8)),
    });
    setMusicPickerVisible(false);
    setMusicDurationInput("8");
    setSongSearchResults([]);
    setSongQueryInput("");
  }, []);

  const handleSearchSongByName = useCallback(async () => {
    const query = songQueryInput.trim();
    if (!query) {
      Alert.alert("Search song", "Type the song name or artist.");
      return;
    }

    setSongSearchLoading(true);
    try {
      const results = await searchSongsByName(query);
      setSongSearchResults(results);
      if (results.length === 0) {
        Alert.alert("No results", "No audio preview found for your search.");
      }
    } catch {
      Alert.alert("Error", "Could not search for the song right now.");
    } finally {
      setSongSearchLoading(false);
    }
  }, [songQueryInput]);

  const handleSelectSongResult = useCallback((song: SongSearchResult) => {
    const chosenDuration = Math.max(3, Math.min(30, Number(musicDurationInput || song.durationSec) || song.durationSec));
    setPosterBackgroundMusic(song.previewUrl, `${song.title} - ${song.artist}`, chosenDuration);
  }, [musicDurationInput, setPosterBackgroundMusic]);

  const updateSticker = useCallback((idToUpdate: string, update: Partial<GifSticker>) => {
    setStickers((prev) => prev.map((s) => (s.id === idToUpdate ? { ...s, ...update } : s)));
  }, []);

  const updateMusicSticker = useCallback((idToUpdate: string, update: Partial<MusicSticker>) => {
    setMusicStickers((prev) => prev.map((s) => (s.id === idToUpdate ? { ...s, ...update } : s)));
  }, []);

  const moveStickerToFinger = useCallback((stickerId: string, pageX: number, pageY: number) => {
    const localX = pageX - canvasOffset.x;
    const localY = pageY - canvasOffset.y;
    const xNorm = localX / Math.max(1, canvasSize.width);
    const yNorm = localY / Math.max(1, canvasSize.height);

    updateSticker(stickerId, {
      x: Math.max(-0.8, Math.min(1.8, xNorm)),
      y: Math.max(-0.8, Math.min(1.8, yNorm)),
    });
  }, [canvasOffset.x, canvasOffset.y, canvasSize.height, canvasSize.width, updateSticker]);

  const beginStickerDrag = useCallback((sticker: GifSticker, pageX: number, pageY: number) => {
    setSelectedStickerId(sticker.id);
    setSelectedMusicId(null);
    setIsStickerMode(true);
    dragStartRef.current = { id: sticker.id, x: sticker.x, y: sticker.y };
    moveStickerToFinger(sticker.id, pageX, pageY);
  }, [moveStickerToFinger]);

  const moveMusicStickerToFinger = useCallback((stickerId: string, pageX: number, pageY: number) => {
    const localX = pageX - canvasOffset.x;
    const localY = pageY - canvasOffset.y;
    const xNorm = localX / Math.max(1, canvasSize.width);
    const yNorm = localY / Math.max(1, canvasSize.height);

    updateMusicSticker(stickerId, {
      x: Math.max(-0.8, Math.min(1.8, xNorm)),
      y: Math.max(-0.8, Math.min(1.8, yNorm)),
    });
  }, [canvasOffset.x, canvasOffset.y, canvasSize.height, canvasSize.width, updateMusicSticker]);

  const beginMusicStickerDrag = useCallback((sticker: MusicSticker, pageX: number, pageY: number) => {
    setSelectedMusicId(sticker.id);
    setSelectedStickerId(null);
    setIsStickerMode(true);
    moveMusicStickerToFinger(sticker.id, pageX, pageY);
  }, [moveMusicStickerToFinger]);

  const endStickerDrag = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  const resizeSelectedSticker = useCallback((delta: number) => {
    if (selectedStickerId) {
      setStickers((prev) =>
        prev.map((s) =>
          s.id === selectedStickerId
            ? { ...s, size: Math.max(0.1, Math.min(0.7, s.size + delta)) }
            : s
        )
      );
      return;
    }
    if (selectedMusicId) {
      setMusicStickers((prev) =>
        prev.map((s) =>
          s.id === selectedMusicId
            ? { ...s, size: Math.max(0.2, Math.min(0.95, s.size + delta)) }
            : s
        )
      );
    }
  }, [selectedMusicId, selectedStickerId]);

  const previewMusicSticker = useCallback(async (sticker: MusicSticker) => {
    try {
      if (isYouTubeUrl(sticker.uri)) {
        Alert.alert("Music Background", "Selecteaza track-ul ca background ca sa porneasca automat pe poster.");
        return;
      }

      if (activeSoundRef.current) {
        await activeSoundRef.current.unloadAsync();
        activeSoundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: sticker.uri },
        { shouldPlay: true, positionMillis: Math.max(0, Math.floor(sticker.startSec * 1000)) }
      );
      activeSoundRef.current = sound;
      setTimeout(() => {
        if (activeSoundRef.current) {
          activeSoundRef.current.stopAsync().catch(() => null);
        }
      }, Math.max(3, Math.min(20, sticker.durationSec)) * 1000);
    } catch {
      Alert.alert("Error", "Could not play this audio clip.");
    }
  }, []);

  const getStickerPanHandlers = useCallback(
    (sticker: GifSticker) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt, gestureState) => beginStickerDrag(sticker, gestureState.x0, gestureState.y0 || evt.nativeEvent.pageY),
        onPanResponderMove: (evt, gestureState) => moveStickerToFinger(sticker.id, gestureState.moveX || evt.nativeEvent.pageX, gestureState.moveY || evt.nativeEvent.pageY),
        onPanResponderRelease: endStickerDrag,
        onPanResponderTerminate: endStickerDrag,
        onPanResponderTerminationRequest: () => false,
      }).panHandlers,
    [beginStickerDrag, endStickerDrag, moveStickerToFinger]
  );

  const getMusicPanHandlers = useCallback(
    (sticker: MusicSticker) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt, gestureState) => beginMusicStickerDrag(sticker, gestureState.x0, gestureState.y0 || evt.nativeEvent.pageY),
        onPanResponderMove: (evt, gestureState) => moveMusicStickerToFinger(sticker.id, gestureState.moveX || evt.nativeEvent.pageX, gestureState.moveY || evt.nativeEvent.pageY),
        onPanResponderRelease: (_evt, gestureState) => {
          const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;
          endStickerDrag();
          if (isTap) {
            previewMusicSticker(sticker);
          }
        },
        onPanResponderTerminate: endStickerDrag,
        onPanResponderTerminationRequest: () => false,
      }).panHandlers,
    [beginMusicStickerDrag, endStickerDrag, moveMusicStickerToFinger, previewMusicSticker]
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
      await deletePoster(id);
      setDeleteConfirmVisible(false);
      router.replace("/feed");
    } catch {
      Alert.alert("Error", "Could not delete this poster.");
    }
  }, [id, router]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Salvează doar adnotările; imaginea de bază rămâne cea inițială.
      await updateDrawing(id, JSON.stringify({ paths, stickers, musicStickers, backgroundMusic }));

      setSaveSuccessVisible(true);
    } catch {
      Alert.alert("Error", "Could not save the annotations.");
    } finally {
      setSaving(false);
    }
  }, [backgroundMusic, id, musicStickers, paths, stickers]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );

  if (!poster)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>The poster was not found.</Text>
      </View>
    );

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {poster.title}
            </Text>
            <Text style={styles.headerDate}>
              {new Date(poster.createdAt).toLocaleDateString("en-US")}
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
                : <Text style={styles.saveBtnText}>Save</Text>
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
        {isStickerMode ? (
          <ViewShot
            ref={viewShotRef}
            style={styles.canvasContainer}
            onLayout={(e) => {
              const { width, height, x, y } = e.nativeEvent.layout;
              setCanvasSize({ width, height });
              setCanvasOffset({ x, y });
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
            {musicStickers.map((sticker) => {
              const widthPx = Math.max(88, Math.min(canvasSize.width * 0.95, sticker.size * canvasSize.width));
              const heightPx = 40;
              const left = sticker.x * canvasSize.width - widthPx / 2;
              const top = sticker.y * canvasSize.height - heightPx / 2;

              return (
                <TouchableOpacity
                  key={sticker.id}
                  style={[
                    styles.musicSticker,
                    selectedMusicId === sticker.id && styles.musicStickerSelected,
                    { width: widthPx, height: heightPx, left, top },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => previewMusicSticker(sticker)}
                  {...getMusicPanHandlers(sticker)}
                >
                  <Ionicons name="musical-notes" size={14} color="#fff" />
                  <Text style={styles.musicStickerText} numberOfLines={1}>{sticker.title}</Text>
                </TouchableOpacity>
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
        ) : (
          <GestureDetector gesture={panGesture}>
            <ViewShot
              ref={viewShotRef}
              style={styles.canvasContainer}
              onLayout={(e) => {
                const { width, height, x, y } = e.nativeEvent.layout;
                setCanvasSize({ width, height });
                setCanvasOffset({ x, y });
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
              {musicStickers.map((sticker) => {
                const widthPx = Math.max(88, Math.min(canvasSize.width * 0.95, sticker.size * canvasSize.width));
                const heightPx = 40;
                const left = sticker.x * canvasSize.width - widthPx / 2;
                const top = sticker.y * canvasSize.height - heightPx / 2;

                return (
                  <TouchableOpacity
                    key={sticker.id}
                    style={[
                      styles.musicSticker,
                      selectedMusicId === sticker.id && styles.musicStickerSelected,
                      { width: widthPx, height: heightPx, left, top },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => previewMusicSticker(sticker)}
                    {...getMusicPanHandlers(sticker)}
                  >
                    <Ionicons name="musical-notes" size={14} color="#fff" />
                    <Text style={styles.musicStickerText} numberOfLines={1}>{sticker.title}</Text>
                  </TouchableOpacity>
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
        )}

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
                style={[
                  styles.strokeBtn,
                  activeWidth === w && styles.strokeBtnActive,
                ]}
                onPress={() => setActiveWidth(w)}
              >
                <View
                  style={{
                    width: w * 1.8,
                    height: w * 1.8,
                    borderRadius: w,
                    backgroundColor: activeColor,
                  }}
                />
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
            <TouchableOpacity
              style={[styles.actionBtn, styles.musicBtn]}
              onPress={() => setMusicPickerVisible(true)}
            >
              <Text style={styles.actionBtnText}>MUSIC</Text>
            </TouchableOpacity>
            {(selectedStickerId || selectedMusicId) && (
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
              <Text style={styles.alertMessage}>Pick a GIF or sticker preset, or paste a direct link.</Text>

              <Text style={styles.sectionLabel}>AI STICKER GENERATOR</Text>
              <TextInput
                value={aiStickerPromptInput}
                onChangeText={setAiStickerPromptInput}
                placeholder="ex: cyberpunk wolf neon"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.gifInput}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.aiGenerateButton, aiStickerLoading && styles.searchSongButtonDisabled]}
                onPress={handleGenerateAiSticker}
                disabled={aiStickerLoading}
              >
                {aiStickerLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.alertButtonText}>GENERATE AI STICKER</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>GIF PRESETS</Text>

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

              <Text style={styles.sectionLabel}>STICKER PRESETS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gifRow}
                style={styles.gifScroll}
              >
                {STICKER_OPTIONS.map((sticker) => (
                  <TouchableOpacity key={sticker} onPress={() => addGifSticker(sticker)} style={styles.gifThumbWrap}>
                    <Image source={{ uri: sticker }} style={styles.gifThumb} resizeMode="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={gifUrlInput}
                onChangeText={setGifUrlInput}
                placeholder="https://...gif / .png / .webp"
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

        <Modal visible={musicPickerVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>MUSIC</Text>
                <Text style={styles.alertHeaderTextSub}> BACKGROUND</Text>
              </View>
              <Text style={styles.alertMessage}>Choose background music for this poster (autoplay on open, no video).</Text>

              <TextInput
                value={songQueryInput}
                onChangeText={setSongQueryInput}
                placeholder="Search by name (e.g. The Weeknd Blinding Lights)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.gifInput}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.searchSongButton, songSearchLoading && styles.searchSongButtonDisabled]}
                disabled={songSearchLoading}
                onPress={handleSearchSongByName}
              >
                {songSearchLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.alertButtonText}>SEARCH SONG</Text>
                )}
              </TouchableOpacity>
              <TextInput
                value={musicDurationInput}
                onChangeText={setMusicDurationInput}
                placeholder="Duration seconds (3-30)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.gifInput}
                keyboardType="numeric"
              />
              {songSearchResults.length > 0 ? (
                <ScrollView style={styles.songResultsList} showsVerticalScrollIndicator={false}>
                  {songSearchResults.map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      style={styles.songResultItem}
                      onPress={() => handleSelectSongResult(song)}
                    >
                      <Text style={styles.songResultTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.songResultMeta} numberOfLines={1}>{song.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              {backgroundMusic?.uri ? (
                <TouchableOpacity
                  style={[styles.alertDeleteButton, { marginTop: 8 }]}
                  onPress={() => setBackgroundMusic(null)}
                >
                  <Text style={styles.alertButtonText}>REMOVE BACKGROUND MUSIC</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.alertCancelButton} onPress={() => setMusicPickerVisible(false)}>
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
              <Text style={styles.alertTitle}>SAVED SUCCESSFULLY</Text>
              <Text style={styles.alertMessage}>Annotations were saved.</Text>
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
              <Text style={styles.alertTitle}>DELETE POSTER</Text>
              <Text style={styles.alertMessage}>
                Do you want to permanently delete &quot;{poster?.title}&quot;?
              </Text>
              <TouchableOpacity style={styles.alertDeleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.alertButtonText}>DELETE POSTER</Text>
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
              <Text style={styles.alertMessage}>Do you want to remove all annotations from this poster?</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 55,
    paddingBottom: 14,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  backBtn: { padding: 4 },
  backBtnText: { color: "#007AFF", fontSize: 14 },
  headerCenter: { flex: 1, alignItems: "center", marginHorizontal: 8 },
  headerTitle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  headerDate: { color: "#555", fontSize: 11, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
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
    backgroundColor: "#1a1a1a",
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  colorRow: { maxHeight: 44 },
  colorRowContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: { borderColor: "#fff", transform: [{ scale: 1.2 }] },
  actionsScroll: { width: "100%", maxHeight: 56 },
  strokeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  strokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  strokeBtnActive: { borderColor: "#007AFF" },
  actionBtn: {
    marginLeft: "auto",
    backgroundColor: "#374151",
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gifBtn: { backgroundColor: "#1d4ed8", width: 52 },
  musicBtn: { backgroundColor: "#6d28d9", width: 70, marginLeft: 0 },
  resizeBtn: { backgroundColor: "#0f766e", marginLeft: 0 },
  actionBtnText: { fontSize: 18 },
  gifSticker: { position: "absolute", borderRadius: 8, zIndex: 20 },
  gifStickerSelected: { borderWidth: 2, borderColor: "#22d3ee" },
  gifStickerImage: { width: "100%", height: "100%" },
  musicSticker: {
    position: "absolute",
    zIndex: 21,
    borderRadius: 10,
    backgroundColor: "rgba(109,40,217,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  musicStickerSelected: { borderColor: "#22d3ee", borderWidth: 2 },
  musicStickerText: { color: "#fff", fontSize: 11, fontWeight: "700", flex: 1 },
  musicPreset: {
    width: 140,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(109,40,217,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  musicPresetText: { color: "#fff", fontWeight: "700", fontSize: 12, flex: 1 },
  searchSongButton: {
    backgroundColor: "#0f766e",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  searchSongButtonDisabled: { opacity: 0.65 },
  songResultsList: {
    width: "100%",
    maxHeight: 170,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  songResultItem: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  songResultTitle: { color: "#fff", fontSize: 12, fontWeight: "700" },
  songResultMeta: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  aiGenerateButton: {
    backgroundColor: "#0b5bd3",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  aiHintText: {
    width: "100%",
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    marginBottom: 12,
  },
  sectionLabel: {
    width: "100%",
    color: "#9cc9ff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
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
