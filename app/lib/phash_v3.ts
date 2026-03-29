import * as Crypto from "expo-crypto";
import * as ImageManipulator from "expo-image-manipulator";

type ParsedV2 = {
    version: "v2";
    strictHash: string;
    signature: number[];
};

type ParsedV3 = {
    version: "v3";
    strictHash: string;
    simHash: string;
};

type ParsedV4 = {
    version: "v4";
    strictHash: string;
    simHash: string;
    signature: number[];
};

const HEX_POPCOUNT = [
    0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4,
];

export async function computeHash(imageUri: string): Promise<string> {
    const tiny = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 64, height: 64 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG, base64: true }
    );

    const base64 = tiny.base64 ?? "";
    const strictHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64
    );
    const simHash = buildSimHash128(base64);
    const signature = buildSignature(base64);
    return `v4|${strictHash}|${simHash}|${signature.join(".")}`;
}

export async function isSamePosterAsync(
    hashA: string,
    hashB: string
): Promise<boolean> {
    return isSamePoster(hashA, hashB);
}

function fnv1a32(input: string, seed = 2166136261): number {
    let hash = seed >>> 0;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
}

function normalizePayload(text: string): string {
    if (!text) return "";
    const start = Math.floor(text.length * 0.12);
    const end = Math.floor(text.length * 0.98);
    return text.substring(start, Math.max(start + 1, end));
}

function toFixedHex(value: number, width: number): string {
    return (value >>> 0).toString(16).padStart(width, "0");
}

function buildSimHash128(text: string): string {
    const payload = normalizePayload(text);
    if (!payload) return "0".repeat(32);

    const window = 6;
    const step = 2;
    const vec = new Array<number>(128).fill(0);
    const upperBound = Math.max(1, payload.length - window + 1);

    for (let i = 0; i < upperBound; i += step) {
        const token = payload.slice(i, i + window);
        if (!token) continue;

        const h1 = fnv1a32(token, 2166136261);
        const h2 = fnv1a32(token, 2166136261 ^ 0x9e3779b1);
        const h3 = fnv1a32(token, 2166136261 ^ 0x85ebca77);
        const h4 = fnv1a32(token, 2166136261 ^ 0xc2b2ae3d);
        const hashes = [h1, h2, h3, h4];

        for (let group = 0; group < 4; group++) {
            const hash = hashes[group];
            for (let bit = 0; bit < 32; bit++) {
                const idx = group * 32 + bit;
                vec[idx] += (hash & (1 << bit)) !== 0 ? 1 : -1;
            }
        }
    }

    let out = "";
    for (let nibbleIndex = 0; nibbleIndex < 32; nibbleIndex++) {
        let nibble = 0;
        for (let bit = 0; bit < 4; bit++) {
            const idx = nibbleIndex * 4 + bit;
            if (vec[idx] >= 0) nibble |= 1 << bit;
        }
        out += nibble.toString(16);
    }

    return out;
}

function isHex128(value: string): boolean {
    return /^[0-9a-f]{32}$/i.test(value);
}

function hammingDistanceHex128(a: string, b: string): number {
    const len = Math.min(a.length, b.length, 32);
    let dist = 0;

    for (let i = 0; i < len; i++) {
        const av = parseInt(a[i], 16);
        const bv = parseInt(b[i], 16);
        if (Number.isNaN(av) || Number.isNaN(bv)) continue;
        dist += HEX_POPCOUNT[av ^ bv];
    }

    return dist + Math.abs(a.length - b.length) * 4;
}

function simHashSimilarity(a: string, b: string): number {
    if (!isHex128(a) || !isHex128(b)) return 0;
    const distance = hammingDistanceHex128(a.toLowerCase(), b.toLowerCase());
    return Math.max(0, Math.min(1, 1 - distance / 128));
}

function parseV3(hash: string): ParsedV3 | null {
    if (!hash.startsWith("v3|")) return null;
    const parts = hash.split("|");
    if (parts.length !== 3) return null;
    const strictHash = parts[1];
    const simHash = parts[2].toLowerCase();
    if (!strictHash || !isHex128(simHash)) return null;
    return { version: "v3", strictHash, simHash };
}

function parseV4(hash: string): ParsedV4 | null {
    if (!hash.startsWith("v4|")) return null;
    const parts = hash.split("|");
    if (parts.length !== 4) return null;
    const strictHash = parts[1];
    const simHash = parts[2].toLowerCase();
    const signature = parts[3]
        .split(".")
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
    if (!strictHash || !isHex128(simHash) || signature.length === 0) return null;
    return { version: "v4", strictHash, simHash, signature };
}

function parseV2(hash: string): ParsedV2 | null {
    if (!hash.startsWith("v2|")) return null;
    const parts = hash.split("|");
    if (parts.length !== 3) return null;
    const strictHash = parts[1];
    const signature = parts[2]
        .split(".")
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
    if (!strictHash || signature.length === 0) return null;
    return { version: "v2", strictHash, signature };
}

function buildSignature(base64: string): number[] {
    if (!base64) return [];

    const start = Math.floor(base64.length * 0.18);
    const end = Math.floor(base64.length * 0.98);
    const payload = base64.substring(start, Math.max(start + 1, end));

    const bins = 64;
    const segLen = Math.max(8, Math.floor(payload.length / bins));
    const signature: number[] = [];

    for (let i = 0; i < bins; i++) {
        const from = i * segLen;
        const seg = payload.substring(from, Math.min(payload.length, from + segLen));
        if (!seg) {
            signature.push(0);
            continue;
        }

        let weighted = 0;
        for (let c = 0; c < seg.length; c++) {
            weighted += seg.charCodeAt(c) * ((c % 7) + 1);
        }
        signature.push(weighted % 256);
    }

    return signature;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const len = Math.min(vecA.length, vecB.length);
    if (len === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
        const a = vecA[i];
        const b = vecB[i];
        dot += a * b;
        normA += a * a;
        normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    const score = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, score));
}

function legacySimilarity(hashA: string, hashB: string): number {
    if (!hashA || !hashB) return 0;

    const lenA = hashA.length;
    const lenB = hashB.length;
    const maxLen = Math.max(lenA, lenB);
    if (maxLen === 0) return 0;

    const lenPenalty = 1 - Math.abs(lenA - lenB) / maxLen;
    if (lenPenalty < 0.86) return 0;

    const sigA = buildSignature(hashA);
    const sigB = buildSignature(hashB);
    return cosineSimilarity(sigA, sigB) * lenPenalty;
}

function v2ToPseudoSimHash(v2: ParsedV2): string {
    const hexChunks = v2.signature.map((n) => toFixedHex(Math.max(0, n) & 0xff, 2));
    const joined = hexChunks.join("");
    return (joined + "0".repeat(32)).slice(0, 32);
}

function v3ToPseudoSignature(v3: ParsedV3): number[] {
    const sig: number[] = [];
    for (let i = 0; i < v3.simHash.length; i += 2) {
        const part = v3.simHash.slice(i, i + 2);
        const value = parseInt(part, 16);
        sig.push(Number.isNaN(value) ? 0 : value);
    }
    return sig;
}

function signatureFromAny(hash: string): number[] | null {
    const v4 = parseV4(hash);
    if (v4) return v4.signature;

    const v2 = parseV2(hash);
    if (v2) return v2.signature;

    const v3 = parseV3(hash);
    if (v3) return v3ToPseudoSignature(v3);

    if (!hash) return null;
    return buildSignature(hash);
}

function simHashFromAny(hash: string): string | null {
    const v4 = parseV4(hash);
    if (v4) return v4.simHash;

    const v3 = parseV3(hash);
    if (v3) return v3.simHash;

    const v2 = parseV2(hash);
    if (v2) return v2ToPseudoSimHash(v2);

    if (!hash) return null;
    return buildSimHash128(hash);
}

export function isExactPosterDuplicate(hashA: string, hashB: string): boolean {
    const a4 = parseV4(hashA);
    const b4 = parseV4(hashB);
    if (a4 && b4) return a4.strictHash === b4.strictHash;

    const a3 = parseV3(hashA);
    const b3 = parseV3(hashB);
    if (a3 && b3) return a3.strictHash === b3.strictHash;

    const a2 = parseV2(hashA);
    const b2 = parseV2(hashB);
    if (a2 && b2) return a2.strictHash === b2.strictHash;

    return legacySimilarity(hashA, hashB) >= 0.995;
}

export function posterSimilarity(hashA: string, hashB: string): number {
    if (!hashA || !hashB) return 0;
    if (isExactPosterDuplicate(hashA, hashB)) return 1;

    const simA = simHashFromAny(hashA);
    const simB = simHashFromAny(hashB);
    const sigA = signatureFromAny(hashA);
    const sigB = signatureFromAny(hashB);

    const simHashScore = simA && simB ? simHashSimilarity(simA, simB) : 0;
    const signatureScore = sigA && sigB ? cosineSimilarity(sigA, sigB) : 0;
    if (simHashScore > 0 || signatureScore > 0) {
        return simHashScore * 0.35 + signatureScore * 0.65;
    }

    return legacySimilarity(hashA, hashB);
}

export function isSamePoster(hashA: string, hashB: string): boolean {
    return isExactPosterDuplicate(hashA, hashB);
}

export function hammingDistance(hashA: string, hashB: string): number {
    if (!hashA || !hashB) return Infinity;
    const len = Math.min(hashA.length, hashB.length);
    let distance = 0;
    for (let i = 0; i < len; i++) {
        if (hashA[i] !== hashB[i]) distance++;
    }
    return distance + Math.abs(hashA.length - hashB.length);
}
