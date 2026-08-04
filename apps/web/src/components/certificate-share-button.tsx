"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Send, Share2, X } from "lucide-react";
import { rasterizeSvgToPng, triggerPngDownload } from "@/lib/client-png";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { trackShareEvent } from "@/lib/share-analytics";
import { directShareTargets, directShareUrl, trackingUrl, type ShareTarget } from "@/lib/share-targets";
import type { CertificateStyle } from "@/lib/share-preview";
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
  const canonicalUrl = `${siteOrigin}${localePath(`/certificate/${encodedId}`, locale)}`;
  const filename = `lovtokens-achievement-${id}-${style}.png`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", escape);
    closeRef.current?.focus();
    void trackShareEvent(id, "certificate", "native", "modal_open");
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

  async function nativeShare() {
    const data = payload("native");
    void trackShareEvent(id, "certificate", "native", "target_click");
    try {
      const file = blob ? new File([blob], filename, { type: "image/png" }) : null;
      if (navigator.share) {
        const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
        await navigator.share({ title: data.title, text: `${data.text}\n${data.url}`, url: data.url, files });
        setStatus(locale === "zh" ? "成就内容已交给系统分享。" : "Achievement handed to system share.");
        void trackShareEvent(id, "certificate", "native", "native_handoff");
      } else {
        await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
        setStatus(locale === "zh" ? "当前浏览器不支持系统分享，文案和链接已复制。" : "System share is unavailable; copy and link were copied.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus(locale === "zh" ? "未能打开系统分享。" : "Could not open system share.");
    }
  }

  async function copy() {
    const data = payload("copy-text");
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
    setStatus(locale === "zh" ? "文案和证明链接已复制。" : "Copy and proof link copied.");
    void trackShareEvent(id, "certificate", "copy-text", "target_click");
  }

  function download() {
    if (!blob) return;
    triggerPngDownload(blob, filename);
    setStatus(locale === "zh" ? "成就 PNG 已下载。" : "Achievement PNG downloaded.");
    void trackShareEvent(id, "certificate", "download", "target_click");
  }

  const directLinks = useMemo(() => directShareTargets.map((target) => ({ target, label: targetNames[target], href: directShareUrl(target, payload(target)) })), [canonicalUrl, message]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <button className={className || "certificate-share-trigger"} onClick={openStudio} type="button"><Share2 aria-hidden="true" size={compact ? 13 : 15} />{locale === "zh" ? "分享成就" : "Share achievement"}</button>
    {open && <div className="share-poster-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <div aria-label={locale === "zh" ? "分享成就" : "Share achievement"} aria-modal="true" className="share-poster-dialog share-studio-dialog" role="dialog">
        <header className="share-poster-head"><div><span className="eyebrow">LovTokens</span><h2>{locale === "zh" ? "分享成就" : "Share achievement"}</h2><p>{title}</p></div><button aria-label={locale === "zh" ? "关闭分享成就" : "Close achievement share"} className="share-poster-close" onClick={() => setOpen(false)} ref={closeRef} type="button"><X size={20} /></button></header>
        <div className="share-poster-body">
          <div className="share-poster-preview"><img alt={`${title} · ${style}`} height={1350} src={imageUrl} width={1080} /></div>
          <div className="share-poster-controls share-studio-controls">
            <div className="share-studio-scroll">
              <div aria-label={locale === "zh" ? "成就卡片样式" : "Achievement card style"} className="share-kind-switch" role="group"><button aria-pressed={style === "collector"} onClick={() => selectStyle("collector")} type="button">{locale === "zh" ? "金属典藏" : "Metal Collector"}</button><button aria-pressed={style === "archive"} onClick={() => selectStyle("archive")} type="button">{locale === "zh" ? "档案典藏" : "Archive Edition"}</button></div>
              <label className="share-copy-editor"><span>{locale === "zh" ? "分享文案" : "Share copy"}</span><textarea maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={4} value={message} /></label>
              <div className="share-direct-targets">{directLinks.map(({ target, href, label }) => <a href={href} key={target} onClick={() => void trackShareEvent(id, "certificate", target, "target_click")} rel="noopener noreferrer" target="_blank"><span aria-hidden="true">{target === "x" ? "X" : target === "linkedin" ? "in" : target === "facebook" ? "f" : target === "telegram" ? "➤" : "◉"}</span>{label}</a>)}</div>
            </div>
            <div className="share-studio-actions">
              <button className="share-native-button" disabled={loading} onClick={nativeShare} type="button"><Send size={16} />{loading ? (locale === "zh" ? "正在准备图片" : "Preparing image") : (locale === "zh" ? "带图片分享" : "Share with image")}</button>
              <div className="share-utility-actions"><button onClick={copy} type="button"><Copy size={14} />{locale === "zh" ? "复制文案" : "Copy text"}</button><button disabled={!blob} onClick={download} type="button"><Download size={14} />{locale === "zh" ? "下载 PNG" : "Download PNG"}</button></div>
              {status && <p aria-live="polite" className="share-studio-status"><Check size={13} />{status}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
