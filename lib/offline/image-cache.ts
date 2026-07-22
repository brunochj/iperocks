import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

const CACHE_DIR = Directory.Cache;
const IMAGE_CACHE = "image-cache-v1";

function urlToFileName(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const ext = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)?.[0] || ".jpg";
  return `${Math.abs(hash)}${ext}`;
}

function getMime(fileName: string): string {
  const ext = fileName.split(".").pop() || "jpeg";
  return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
}

export async function getCachedImageUrl(url: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return null;

  try {
    const fileName = urlToFileName(url);
    const filePath = `${IMAGE_CACHE}/${fileName}`;

    await Filesystem.stat({ path: filePath, directory: CACHE_DIR });
    const contents = await Filesystem.readFile({
      path: filePath,
      directory: CACHE_DIR,
    });
    return `data:${getMime(fileName)};base64,${contents.data}`;
  } catch {
    return null;
  }
}

export async function cacheImage(url: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return null;

  try {
    const fileName = urlToFileName(url);
    const filePath = `${IMAGE_CACHE}/${fileName}`;

    // Check if already cached
    try {
      await Filesystem.stat({ path: filePath, directory: CACHE_DIR });
      const contents = await Filesystem.readFile({
        path: filePath,
        directory: CACHE_DIR,
      });
      return `data:${getMime(fileName)};base64,${contents.data}`;
    } catch {
      // Not cached, continue to download
    }

    // Download and convert to base64
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Save to filesystem (base64 is the default encoding)
    await Filesystem.writeFile({
      path: filePath,
      data: base64,
      directory: CACHE_DIR,
    });

    return `data:${getMime(fileName)};base64,${base64}`;
  } catch (error) {
    console.warn("Failed to cache image:", url, error);
    return null;
  }
}
