"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { PngDownloadButton } from "./png-download-button";
/* eslint-disable @next/next/no-img-element -- generated share posters are dynamic SVG endpoints */

type SharePosterTheme = "obsidian" | "terminal" | "ivory" | "aurora";

const themeOptions: Array<{ key: SharePosterTheme; name: string }> = [
  { key: "obsidian", name: "Obsidian Lime" },
  { key: "terminal", name: "Terminal Neon" },
  { key: "ivory", name: "Ivory Paper" },
  { key: "aurora", name: "Aurora Glow" },
];

export function SharePosterButton({ handle, locale }: { handle: string; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<SharePosterTheme>("obsidian");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const selected = themeOptions.find((theme) => theme.key === selectedTheme) ?? themeOptions[0]!;
  const sourceUrl = `/share/${handle}/profile.svg?theme=${selected.key}`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = triggerButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      triggerButton?.focus();
    };
  }, [open]);

  return <>
    <button className="profile-share-button" onClick={() => setOpen(true)} ref={triggerButtonRef} type="button">
      <Share2 size={16} />{locale === "zh" ? "分享海报" : "Share poster"}
    </button>
    {open && <div className="share-poster-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <div aria-label={locale === "zh" ? "选择海报样式" : "Choose a poster style"} aria-modal="true" className="share-poster-dialog" role="dialog">
        <header className="share-poster-head">
          <div><span className="eyebrow">LovTokens</span><h2>{locale === "zh" ? "选择海报样式" : "Choose a poster style"}</h2><p>{locale === "zh" ? "选择喜欢的样式，下载为 1080 × 1350 PNG 图片。" : "Choose a style and download a 1080 × 1350 PNG image."}</p></div>
          <button aria-label={locale === "zh" ? "关闭海报选择" : "Close poster picker"} className="share-poster-close" onClick={() => setOpen(false)} ref={closeButtonRef} type="button"><X size={20} /></button>
        </header>
        <div className="share-poster-body">
          <div className="share-poster-preview"><img alt={`${selected.name} ${locale === "zh" ? "分享海报预览" : "share poster preview"}`} height={1350} src={sourceUrl} width={1080} /></div>
          <div className="share-poster-controls">
            <div aria-label={locale === "zh" ? "海报样式" : "Poster styles"} className="share-poster-themes" role="group">
              {themeOptions.map((theme) => <button aria-pressed={theme.key === selectedTheme} data-selected={theme.key === selectedTheme || undefined} key={theme.key} onClick={() => setSelectedTheme(theme.key)} type="button"><span data-theme={theme.key} /><strong>{theme.name}</strong><small>{theme.key === selectedTheme ? (locale === "zh" ? "已选择" : "Selected") : (locale === "zh" ? "选择" : "Choose")}</small></button>)}
            </div>
            <PngDownloadButton className="share-poster-download" filename={`lovtokens-${handle}-${selected.key}.png`} loadingLabel={locale === "zh" ? "正在生成图片" : "Generating image"} sourceUrl={sourceUrl}>{locale === "zh" ? "下载图片" : "Download image"}<Download size={16} /></PngDownloadButton>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
