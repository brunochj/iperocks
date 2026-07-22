"use client";
import { useState, useEffect } from "react";
import { getCachedImageUrl, cacheImage } from "@/lib/offline/image-cache";

const inflight = new Map<string, Promise<string | null>>();

export function useCachedImage(url: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      // 1. Try cache first
      const cached = await getCachedImageUrl(url);
      if (cancelled) return;
      if (cached) {
        setSrc(cached);
        return;
      }

      // 2. Download + cache (deduplicate concurrent requests)
      if (!inflight.has(url)) {
        inflight.set(url, cacheImage(url));
      }
      const cachedUrl = await inflight.get(url)!;
      inflight.delete(url);

      if (!cancelled) {
        setSrc(cachedUrl);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return src;
}

import React from "react";

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
}

export function CachedImage({ src: originalSrc, onError, ...props }: CachedImageProps) {
  const cachedSrc = useCachedImage(originalSrc);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [originalSrc]);

  const finalSrc = useFallback ? originalSrc : cachedSrc || originalSrc;

  if (!finalSrc) return null;

  return (
    <img
      src={finalSrc}
      onError={(e) => {
        if (!useFallback && cachedSrc && originalSrc) {
          setUseFallback(true);
        }
        onError?.(e);
      }}
      {...props}
    />
  );
}
