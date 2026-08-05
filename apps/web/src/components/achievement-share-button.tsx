"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Image as ImageIcon, Share2, X } from "lucide-react";
import { renderAchievementSharePng, type AchievementShareStyle } from "@/lib/achievement-share-image";
import { copyPngToClipboard, triggerPngDownload } from "@/lib/client-png";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { trackShareEvent } from "@/lib/share-analytics";
import { directShareTargets, directShareUrl, trackingUrl, type ShareTarget } from "@/lib/share-targets";
import { XPublishButton } from "./x-publish-button";
/* eslint-disable @next/next/no-img-element -- the preview is a client-generated blob URL */

const targetNames = { x: "X", linkedin: "LinkedIn", facebook: "Facebook", telegram: "Telegram", whatsapp: "WhatsApp" } as const;

type Props = {
  achievementKey: string;
  badgeImage: string;
  title: string;
  description: string;
  mark: string;
  targetLabel: string;
  earnedAt?: number;
  locale: Locale;
  siteOrigin: string;
  profile: { displayName: string; handle: string; isPublic: boolean };
};

export function AchievementShareButton({ achievementKey, badgeImage, title, description, mark, targetLabel, earnedAt, locale, siteOrigin, profile }: Props) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<AchievementShareStyle>("signal");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState(locale === "zh" ? `我在 LovTokens 解锁了「${title}」成就徽章。` : `I unlocked the “${title}” achievement badge on LovTokens.`);
  const closeRef = useRef<HTMLButtonElement>(null);
  const earnedLabel = earnedAt
    ? `${locale === "zh" ? "获得于" : "Earned"} ${new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium" }).format(new Date(earnedAt * 1000))}`
    : (locale === "zh" ? "已完成解锁条件" : "Unlock condition completed");
  const publicPath = `${localePath(`/u/${encodeURIComponent(profile.handle)}`, locale)}?achievement=${encodeURIComponent(achievementKey)}#achievement-${encodeURIComponent(achievementKey)}`;
  const canonicalUrl = profile.isPublic ? `${siteOrigin}${publicPath}` : siteOrigin;
  const filename = `lovtokens-${achievementKey}-${style}.png`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", escape);
    closeRef.current?.focus();
    void trackShareEvent(profile.handle, "achievement", "copy-image", "modal_open");
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", escape); };
  }, [open, profile.handle]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl = "";
    renderAchievementSharePng({ style, badgeImage, title, description, mark, targetLabel, displayName: profile.displayName, handle: profile.handle, earnedLabel, canonicalUrl, isPublic: profile.isPublic })
      .then((result) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(result);
        setBlob(result);
        setPreviewUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setStatus(locale === "zh" ? "分享图片生成失败，请重试。" : "Could not generate the share image. Try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [badgeImage, canonicalUrl, description, earnedLabel, locale, mark, open, profile.displayName, profile.handle, profile.isPublic, style, targetLabel, title]);

  function payload(target: ShareTarget) {
    return { title, text: message.trim(), url: trackingUrl(canonicalUrl, target, "achievement") };
  }

  function openStudio() {
    setStatus("");
    setLoading(true);
    setBlob(null);
    setPreviewUrl("");
    setOpen(true);
  }

  function selectStyle(next: AchievementShareStyle) {
    if (next === style) return;
    setLoading(true);
    setBlob(null);
    setPreviewUrl("");
    setStyle(next);
  }

  async function copyImage() {
    if (!blob) return;
    const copied = await copyPngToClipboard(blob);
    if (!copied) triggerPngDownload(blob, filename);
    setStatus(copied ? (locale === "zh" ? "当前徽章图片已复制。" : "Current badge image copied.") : (locale === "zh" ? "浏览器不支持复制图片，已改为下载当前 PNG。" : "Image copy is unavailable, so the current PNG was downloaded."));
    void trackShareEvent(profile.handle, "achievement", "copy-image", "target_click");
  }

  function download() {
    if (!blob) return;
    triggerPngDownload(blob, filename);
    setStatus(locale === "zh" ? "徽章分享图已下载。" : "Badge share image downloaded.");
    void trackShareEvent(profile.handle, "achievement", "download", "target_click");
  }

  const directLinks = useMemo(() => directShareTargets.filter((target) => target !== "x").map((target) => ({ target, label: targetNames[target], href: directShareUrl(target, payload(target)) })), [canonicalUrl, message]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <button className="achievement-share-trigger" onClick={openStudio} type="button"><Share2 aria-hidden="true" size={13} />{locale === "zh" ? "分享徽章" : "Share badge"}</button>
    {open && <div className="share-poster-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <div aria-label={locale === "zh" ? "分享成就徽章" : "Share achievement badge"} aria-modal="true" className="share-poster-dialog share-studio-dialog" role="dialog">
        <header className="share-poster-head"><div><span className="eyebrow">LovTokens · Badge Studio</span><h2>{locale === "zh" ? "把这枚徽章分享出去" : "Share this badge"}</h2><p>{title} · {targetLabel}</p></div><button aria-label={locale === "zh" ? "关闭徽章分享" : "Close badge share"} className="share-poster-close" onClick={() => setOpen(false)} ref={closeRef} type="button"><X size={20} /></button></header>
        <div className="share-poster-body">
          <div className="share-preview-column">
            <div className="share-poster-preview achievement-share-preview">{previewUrl ? <img alt={`${title} · ${style}`} height={1350} src={previewUrl} width={1080} /> : <span>{locale === "zh" ? "正在生成 1080 × 1350 徽章卡片…" : "Generating the 1080 × 1350 badge card…"}</span>}</div>
          </div>
          <div className="share-poster-controls share-studio-controls">
            <div className="share-studio-scroll">
              <div className="share-side-options"><div aria-label={locale === "zh" ? "徽章卡片风格" : "Badge card style"} className="share-kind-switch" role="group"><button aria-pressed={style === "signal"} onClick={() => selectStyle("signal")} type="button">{locale === "zh" ? "夜航信号" : "Night Signal"}</button><button aria-pressed={style === "gallery"} onClick={() => selectStyle("gallery")} type="button">{locale === "zh" ? "纸上藏馆" : "Paper Gallery"}</button></div></div>
              <label className="share-copy-editor"><span>{locale === "zh" ? "分享文案" : "Share copy"}</span><textarea maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={4} value={message} /></label>
              {!profile.isPublic && <p className="achievement-share-private-note">{locale === "zh" ? "你的公开主页当前为私密状态：分享图仍可下载或随系统分享，链接会指向 LovTokens 首页。" : "Your public profile is private: the image can still be downloaded or shared, while the link points to LovTokens home."}</p>}
              <div className="share-direct-targets"><XPublishButton blob={blob} filename={filename} locale={locale} onPublished={() => void trackShareEvent(profile.handle, "achievement", "x", "target_click")} onStatus={setStatus} text={message} url={payload("x").url} />{directLinks.map(({ target, href, label }) => <a href={href} key={target} onClick={() => void trackShareEvent(profile.handle, "achievement", target, "target_click")} rel="noopener noreferrer" target="_blank"><span aria-hidden="true">{target === "linkedin" ? "in" : target === "facebook" ? "f" : target === "telegram" ? "➤" : "◉"}</span>{label}</a>)}</div>
            </div>
            <div className="share-studio-actions"><div className="share-utility-actions"><button disabled={loading || !blob} onClick={copyImage} type="button"><ImageIcon size={14} />{loading ? (locale === "zh" ? "准备图片" : "Preparing") : (locale === "zh" ? "复制图片" : "Copy image")}</button><button disabled={!blob} onClick={download} type="button"><Download size={14} />{locale === "zh" ? "下载 PNG" : "Download PNG"}</button></div>{status && <p aria-live="polite" className="share-studio-status"><Check size={13} />{status}</p>}</div>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
