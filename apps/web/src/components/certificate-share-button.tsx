"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Image as ImageIcon, Share2, X } from "lucide-react";
import { copyPngToClipboard, rasterizeSvgToPng, triggerPngDownload } from "@/lib/client-png";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { trackShareEvent } from "@/lib/share-analytics";
import { directShareTargets, directShareUrl, trackingUrl, type ShareTarget } from "@/lib/share-targets";
import type { CertificateStyle } from "@/lib/share-preview";
import { XPublishButton } from "./x-publish-button";
/* eslint-disable @next/next/no-img-element -- achievement images are generated SVG endpoints */

const targetNames = { x: "X", linkedin: "LinkedIn", facebook: "Facebook", telegram: "Telegram", whatsapp: "WhatsApp" } as const;

type Props = {
  id: string;
  locale: Locale;
  siteOrigin: string;
  title: string;
  processedTokens: number;
  canPublishPreview?: boolean;
  initialOpen?: boolean;
  className?: string;
  compact?: boolean;
};

export function CertificateShareButton({ id, locale, siteOrigin, title, processedTokens, canPublishPreview = false, initialOpen = false, className, compact = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [style, setStyle] = useState<CertificateStyle>("collector");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(initialOpen);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState(locale === "zh" ? `我在 LovTokens 获得了 ${formatTokenCount(processedTokens)} Token 成就，查看可验证的成就证明。` : `I earned a ${formatTokenCount(processedTokens)} token achievement on LovTokens. View the verifiable proof.`);
  const closeRef = useRef<HTMLButtonElement>(null);
  const encodedId = encodeURIComponent(id);
  const imageUrl = `/certificate/${encodedId}/image?lang=${locale}&style=${style}`;
  const sharePageUrl = new URL(localePath(`/certificate/${encodedId}`, locale), siteOrigin);
  sharePageUrl.searchParams.set("share_style", style);
  const canonicalUrl = sharePageUrl.toString();
  const filename = `lovtokens-achievement-${id}-${style}.png`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", escape);
    closeRef.current?.focus();
    void trackShareEvent(id, "certificate", "copy-image", "modal_open");
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", escape); };
  }, [id, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    rasterizeSvgToPng(imageUrl, 1080, 1350).then((result) => { if (!cancelled) setBlob(result); }).catch(() => undefined).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [imageUrl, open]);

  useEffect(() => {
    if (!open || !canPublishPreview || !blob) return;
    fetch(`/api/share-preview?kind=certificate&id=${encodedId}&style=${style}&locale=${locale === "zh" ? "zh" : "en"}`, { method: "POST", headers: { "content-type": "image/png" }, body: blob }).catch(() => undefined);
  }, [blob, canPublishPreview, encodedId, locale, open, style]);

  function payload(target: ShareTarget) {
    return { title, text: message.trim(), url: trackingUrl(canonicalUrl, target, "certificate") };
  }

  function openStudio() {
    setBlob(null);
    setLoading(true);
    setOpen(true);
  }

  function selectStyle(next: CertificateStyle) {
    setStyle(next);
    setBlob(null);
    setLoading(true);
  }

  async function copyImage() {
    if (!blob) return;
    const copied = await copyPngToClipboard(blob);
    if (!copied) triggerPngDownload(blob, filename);
    setStatus(copied ? (locale === "zh" ? "当前成就图片已复制。" : "Current achievement image copied.") : (locale === "zh" ? "浏览器不支持复制图片，已改为下载当前 PNG。" : "Image copy is unavailable, so the current PNG was downloaded."));
    void trackShareEvent(id, "certificate", "copy-image", "target_click");
  }

  function download() {
    if (!blob) return;
    triggerPngDownload(blob, filename);
    setStatus(locale === "zh" ? "成就 PNG 已下载。" : "Achievement PNG downloaded.");
    void trackShareEvent(id, "certificate", "download", "target_click");
  }

  const directLinks = useMemo(() => directShareTargets.filter((target) => target !== "x").map((target) => ({ target, label: targetNames[target], href: directShareUrl(target, payload(target)) })), [canonicalUrl, message]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <button className={className || "certificate-share-trigger"} onClick={openStudio} type="button"><Share2 aria-hidden="true" size={compact ? 13 : 15} />{locale === "zh" ? "分享成就" : "Share achievement"}</button>
    {open && <div className="share-poster-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <div aria-label={locale === "zh" ? "分享成就" : "Share achievement"} aria-modal="true" className="share-poster-dialog share-studio-dialog" role="dialog">
        <header className="share-poster-head"><div><span className="eyebrow">LovTokens</span><h2>{locale === "zh" ? "分享成就" : "Share achievement"}</h2><p>{title}</p></div><button aria-label={locale === "zh" ? "关闭分享成就" : "Close achievement share"} className="share-poster-close" onClick={() => setOpen(false)} ref={closeRef} type="button"><X size={20} /></button></header>
        <div className="share-poster-body">
          <div className="share-preview-column">
            <div className="share-poster-preview"><img alt={`${title} · ${style}`} height={1350} src={imageUrl} width={1080} /></div>
          </div>
          <div className="share-poster-controls share-studio-controls">
            <div className="share-studio-scroll">
              <div className="share-side-options"><div aria-label={locale === "zh" ? "成就卡片样式" : "Achievement card style"} className="share-kind-switch" role="group"><button aria-pressed={style === "collector"} onClick={() => selectStyle("collector")} type="button">{locale === "zh" ? "金属典藏" : "Metal Collector"}</button><button aria-pressed={style === "archive"} onClick={() => selectStyle("archive")} type="button">{locale === "zh" ? "档案典藏" : "Archive Edition"}</button></div></div>
              <label className="share-copy-editor"><span>{locale === "zh" ? "分享文案" : "Share copy"}</span><textarea maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={4} value={message} /></label>
              <div className="share-direct-targets"><XPublishButton blob={blob} filename={filename} locale={locale} onPublished={() => void trackShareEvent(id, "certificate", "x", "target_click")} onStatus={setStatus} text={message} url={payload("x").url} />{directLinks.map(({ target, href, label }) => <a href={href} key={target} onClick={() => void trackShareEvent(id, "certificate", target, "target_click")} rel="noopener noreferrer" target="_blank"><span aria-hidden="true">{target === "linkedin" ? "in" : target === "facebook" ? "f" : target === "telegram" ? "➤" : "◉"}</span>{label}</a>)}</div>
            </div>
            <div className="share-studio-actions">
              <div className="share-utility-actions"><button disabled={loading || !blob} onClick={copyImage} type="button"><ImageIcon size={14} />{loading ? (locale === "zh" ? "准备图片" : "Preparing") : (locale === "zh" ? "复制图片" : "Copy image")}</button><button disabled={!blob} onClick={download} type="button"><Download size={14} />{locale === "zh" ? "下载 PNG" : "Download PNG"}</button></div>
              {status && <p aria-live="polite" className="share-studio-status"><Check size={13} />{status}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
