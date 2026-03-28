import * as ImageManipulator from "expo-image-manipulator";

// Setări fixe — TREBUIE să fie identice pentru ambele imagini
const THUMB_W = 8;
const THUMB_H = 8;
const THUMB_COMPRESS = 0.1; // compresie maximă = mai puțini bytes = mai ușor de comparat

export async function computeHash(imageUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      { resize: { width: THUMB_W, height: THUMB_H } },
    ],
    {
      compress: THUMB_COMPRESS,
      format: ImageManipulator.SaveFormat.PNG, // PNG e lossless — nu introduce variații
      base64: true,
    }
  );
  return result.base64!;
}

export async function isSamePosterAsync(
  hashA: string,
  hashB: string
): Promise<boolean> {
  return isSamePoster(hashA, hashB);
}

export function isSamePoster(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;

  // PNG lossless la 8x8 ar trebui să producă base64 aproape identic
  // pentru același afiș fotografiat în condiții similare

  // 1. Verifică lungimea — dacă diferă cu mai mult de 30% nu e același afiș
  const lenA = hashA.length;
  const lenB = hashB.length;
  const lenDiff = Math.abs(lenA - lenB) / Math.max(lenA, lenB);
  if (lenDiff > 0.30) return false;

  // 2. Compară întreg base64-ul caracter cu caracter
  const minLen = Math.min(lenA, lenB);
  let matches = 0;

  for (let i = 0; i < minLen; i++) {
    if (hashA[i] === hashB[i]) matches++;
  }

  const similarity = matches / minLen;
  return similarity > 0.55; // 55% similaritate = același afiș
}

export function hammingDistance(hashA: string, hashB: string): number {
  return Math.abs(hashA.length - hashB.length);
}