import * as ImageManipulator from "expo-image-manipulator";

export async function computeHash(imageUri: string): Promise<string> {
  // Comprimăm la calitate 0 — produce un fișier JPEG minim
  // Același afiș → structură JPEG similară
  const tiny = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 16, height: 16 } }],
    { compress: 0, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  return tiny.base64!;
}

export async function isSamePosterAsync(
  hashA: string,
  hashB: string
): Promise<boolean> {
  return isSamePoster(hashA, hashB);
}

export function posterSimilarity(hashA: string, hashB: string): number {
  if (!hashA || !hashB) return 0;

  const lenA = hashA.length;
  const lenB = hashB.length;
  const maxLen = Math.max(lenA, lenB);
  const minLen = Math.min(lenA, lenB);
  if (maxLen === 0) return 0;

  // Diferența mare de lungime indică imagini diferite.
  const lenPenalty = 1 - Math.abs(lenA - lenB) / maxLen;
  if (lenPenalty < 0.88) return 0;

  // Header-ul JPEG în base64 este foarte asemănător între imagini;
  // ignorăm începutul ca să comparăm partea utilă.
  const startA = Math.min(Math.floor(lenA * 0.28), lenA - 1);
  const startB = Math.min(Math.floor(lenB * 0.28), lenB - 1);
  const endA = Math.max(startA + 1, Math.floor(lenA * 0.95));
  const endB = Math.max(startB + 1, Math.floor(lenB * 0.95));

  const payloadA = hashA.substring(startA, endA);
  const payloadB = hashB.substring(startB, endB);
  const payloadLen = Math.min(payloadA.length, payloadB.length);
  if (payloadLen < 80) return 0;

  const segCount = 14;
  const segSize = Math.max(12, Math.floor(payloadLen / 24));
  let total = 0;

  for (let s = 0; s < segCount; s++) {
    const posA = Math.floor((s / segCount) * Math.max(1, payloadA.length - segSize));
    const posB = Math.floor((s / segCount) * Math.max(1, payloadB.length - segSize));
    const segA = payloadA.substring(posA, posA + segSize);
    const segB = payloadB.substring(posB, posB + segSize);

    const len = Math.min(segA.length, segB.length);
    if (len === 0) continue;

    let matches = 0;
    for (let i = 0; i < len; i++) {
      if (segA[i] === segB[i]) matches++;
    }
    total += matches / len;
  }

  const avgPayloadSimilarity = total / segCount;
  return avgPayloadSimilarity * lenPenalty;
}

export function isSamePoster(hashA: string, hashB: string): boolean {
  return posterSimilarity(hashA, hashB) >= 0.9;
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