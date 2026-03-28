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

export function isSamePoster(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;

  // La compress: 0 și 16x16, JPEG produce fișiere de ~200-400 bytes
  // Structura DCT e determinată de conținutul imaginii
  // Același afiș → bytes similari în aceleași poziții

  const lenA = hashA.length;
  const lenB = hashB.length;

  // Diferență de lungime > 25% = imagini diferite
  const lenDiff = Math.abs(lenA - lenB) / Math.max(lenA, lenB);
  if (lenDiff > 0.25) return false;

  // Compară 10 segmente uniforme
  const segCount = 10;
  const segSize = 20;
  let totalSim = 0;

  for (let s = 0; s < segCount; s++) {
    const posA = Math.floor((s / segCount) * (lenA - segSize));
    const posB = Math.floor((s / segCount) * (lenB - segSize));
    
    const segA = hashA.substring(Math.max(0, posA), posA + segSize);
    const segB = hashB.substring(Math.max(0, posB), posB + segSize);
    
    let matches = 0;
    const len = Math.min(segA.length, segB.length);
    for (let i = 0; i < len; i++) {
      if (segA[i] === segB[i]) matches++;
    }
    totalSim += len > 0 ? matches / len : 0;
  }

  const avgSim = totalSim / segCount;
  return avgSim > 0.82; // 82% similaritate
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