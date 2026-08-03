"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import Image from "next/image";
import { ShareCardPreview, type ShareCardPreviewProps, type ShareCardTheme } from "./share-card-preview";

const themeOptions: Array<{ key: ShareCardTheme; name: string }> = [
  { key: "obsidian", name: "Obsidian Lime" },
  { key: "terminal", name: "Terminal Neon" },
  { key: "ivory", name: "Ivory Paper" },
  { key: "aurora", name: "Aurora Glow" },
];

type GalleryProps = Omit<ShareCardPreviewProps, "theme" | "sample"> & { downloadEnabled?: boolean };

export function ShareThemeGallery({ downloadEnabled = true, ...preview }: GalleryProps) {
  const locale = preview.locale || "en";
  const [selectedTheme, setSelectedTheme] = useState<ShareCardTheme | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selected = themeOptions.find((theme) => theme.key === selectedTheme) || null;

  useEffect(() => {
    if (!selectedTheme) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedTheme(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedTheme]);

  return <><div className="share-theme-gallery">{themeOptions.map((theme) => {
    const imageUrl = `/share/${preview.handle}/profile.png?theme=${theme.key}`;
    const previewLabel = `${locale === "zh" ? "放大预览" : "Enlarge preview"} ${theme.name}`;
    return <div className="share-theme-option" key={theme.key}>
      <button aria-label={previewLabel} className="share-theme-preview-button" onClick={() => setSelectedTheme(theme.key)} type="button">
        {downloadEnabled
          ? <Image alt={`${theme.name} ${locale === "zh" ? "竖版分享卡片" : "portrait share card"}`} className="share-theme-image" height={1350} src={imageUrl} unoptimized width={1080} />
          : <ShareCardPreview {...preview} theme={theme.key} />}
      </button>
      <span className="share-theme-meta"><span><strong>{theme.name}</strong><small>1080 × 1350 · PNG</small></span>{downloadEnabled
        ? <a className="share-theme-download" download={`lovtokens-${preview.handle}-${theme.key}.png`} href={`${imageUrl}&download=1`}>{locale === "zh" ? "下载" : "Download"}<Download size={13} /></a>
        : <span>{locale === "zh" ? "公开后下载" : "Publish to download"}<Download size={13} /></span>}</span>
    </div>;
  })}</div>{selected && <div className="share-lightbox" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedTheme(null); }}>
    <div aria-label={`${selected.name} ${locale === "zh" ? "放大预览" : "enlarged preview"}`} aria-modal="true" className="share-lightbox-dialog" role="dialog">
      <button aria-label={locale === "zh" ? "关闭预览" : "Close preview"} className="share-lightbox-close" onClick={() => setSelectedTheme(null)} ref={closeButtonRef} type="button"><X size={20} /></button>
      <div className="share-lightbox-card">{downloadEnabled
        ? <Image alt={`${selected.name} ${locale === "zh" ? "竖版分享卡片放大预览" : "enlarged portrait share card"}`} className="share-lightbox-image" height={1350} priority src={`/share/${preview.handle}/profile.png?theme=${selected.key}`} unoptimized width={1080} />
        : <ShareCardPreview {...preview} theme={selected.key} />}</div>
      <div className="share-lightbox-foot"><span><strong>{selected.name}</strong><small>1080 × 1350 · PNG</small></span>{downloadEnabled && <a download={`lovtokens-${preview.handle}-${selected.key}.png`} href={`/share/${preview.handle}/profile.png?theme=${selected.key}&download=1`}>{locale === "zh" ? "下载图片" : "Download image"}<Download size={14} /></a>}</div>
    </div>
  </div>}</>;
}
