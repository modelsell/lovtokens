"use client";

import { useEffect, useState } from "react";

export async function rasterizeSvgToPng(sourceUrl: string, width: number, height: number) {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Unable to load image (${response.status})`);
  const source = new Blob([await response.text()], { type: "image/svg+xml;charset=utf-8" });
  const sourceObjectUrl = URL.createObjectURL(source);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = sourceObjectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to decode SVG image"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to encode PNG image")), "image/png"));
  } finally {
    URL.revokeObjectURL(sourceObjectUrl);
  }
}

export function useRasterizedPng(sourceUrl: string | null, width: number, height: number) {
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl) return;
    let active = true;
    let objectUrl: string | null = null;
    rasterizeSvgToPng(sourceUrl, width, height).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setPngUrl(objectUrl);
    }).catch(() => { if (active) setPngUrl(null); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [height, sourceUrl, width]);

  return pngUrl;
}

export function triggerPngDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
