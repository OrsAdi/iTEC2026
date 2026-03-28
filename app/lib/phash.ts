import * as ImageManipulator from "expo-image-manipulator";

export async function computeHash(imageUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 16, height: 16 } }],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
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

  // Diferență de lungime — dacă diferă mult nu e același afiș
  const lenDiff = Math.abs(hashA.length - hashB.length);
  const avgLen = (hashA.length + hashB.length) / 2;
  if (lenDiff / avgLen > 0.20) return false;

  // Compară 5 segmente uniform distribuite
  const segSize = 50;
  let totalMatches = 0;
  let totalChars = 0;

  for (let seg = 0; seg < 5; seg++) {
    const posA = Math.floor((seg / 5) * (hashA.length - segSize));
    const posB = Math.floor((seg / 5) * (hashB.length - segSize));
    const segA = hashA.substring(posA, posA + segSize);
    const segB = hashB.substring(posB, posB + segSize);

    for (let i = 0; i < segSize; i++) {
      if (segA[i] === segB[i]) totalMatches++;
      totalChars++;
    }
  }

  const similarity = totalMatches / totalChars;
  console.log("📊 Similaritate:", similarity.toFixed(3));
  return similarity > 0.60;
}

export function hammingDistance(hashA: string, hashB: string): number {
  return Math.abs(hashA.length - hashB.length);
}