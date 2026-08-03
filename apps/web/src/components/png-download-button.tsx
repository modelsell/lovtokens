"use client";

import { useState, type ReactNode } from "react";
import { rasterizeSvgToPng, triggerPngDownload } from "@/lib/client-png";

export function PngDownloadButton({ children, className, filename, height = 1350, loadingLabel, sourceUrl, width = 1080 }: { children: ReactNode; className?: string; filename: string; height?: number; loadingLabel: string; sourceUrl: string; width?: number }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try { triggerPngDownload(await rasterizeSvgToPng(sourceUrl, width, height), filename); }
    finally { setBusy(false); }
  }

  return <button className={className} disabled={busy} onClick={download} type="button">{busy ? loadingLabel : children}</button>;
}
