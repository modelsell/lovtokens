"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, Link2, Send, Share2, X } from "lucide-react";
import { rasterizeSvgToPng, triggerPngDownload } from "@/lib/client-png";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { trackShareEvent } from "@/lib/share-analytics";
import { directShareTargets, directShareUrl, trackingUrl, type ShareContentKind, type ShareTarget } from "@/lib/share-targets";
import type { ShareTheme } from "@/lib/share-preview";
/* eslint-disable @next/next/no-img-element -- generated share posters are dynamic SVG endpoints */

const themeOptions: Array<{ key: ShareTheme; name: string }> = [
  { key: "obsidian", name: "Obsidian Lime" },
  { key: "terminal", name: "Terminal Neon" },
  { key: "ivory", name: "Ivory Paper" },
  { key: "aurora", name: "Aurora Glow" },
];

const targetNames = { x: "X", linkedin: "LinkedIn", facebook: "Facebook", telegram: "Telegram", whatsapp: "WhatsApp" } as const;

type Props = {
  handle: string;
  locale: Locale;
  siteOrigin: string;
  displayName: string;
  processedTokens: number;
  rank: number;
  activeDays: number;
  showExactTokens: boolean;
  showRank: boolean;
  canPublishPreview?: boolean;
  initialOpen?: boolean;
};

export function SharePosterButton(props: Props) {
  const { handle, locale, siteOrigin, canPublishPreview = false, initialOpen = false } = props;
  const [open, setOpen] = useState(initialOpen);
  const [selectedTheme, setSelectedTheme] = useState<ShareTheme>("obsidian");
  const [contentKind, setContentKind] = useState<Extract<ShareContentKind, "profile" | "month">>("profile");
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [posterState, setPosterState] = useState<"idle" | "loading" | "ready" | "failed">(initialOpen ? "loading" : "idle");
  const [message, setMessage] = useState(shareCopy(props, "profile"));
  const [status, setStatus] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const selected = themeOptions.find((theme) => theme.key === selectedTheme) ?? themeOptions[0]!;
  const source = contentKind === "profile"
    ? { url: `/share/${handle}/profile.svg?theme=${selected.key}`, width: 1080, height: 1350, label: locale === "zh" ? "全部档案" : "All-time profile" }
    : { url: `/share/${handle}/month.svg?theme=${selected.key}`, width: 1200, height: 630, label: locale === "zh" ? "本月战报" : "Monthly recap" };
  const filename = `lovtokens-${handle}-${contentKind}-${selected.key}.png`;
  const canonicalUrl = `${siteOrigin}${localePath(`/u/${handle}`, locale)}`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = triggerButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    void trackShareEvent(handle, "profile", "native", "modal_open");
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      triggerButton?.focus();
    };
  }, [handle, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    rasterizeSvgToPng(source.url, source.width, source.height).then((blob) => {
      if (cancelled) return;
      setPosterBlob(blob);
      setPosterState("ready");
    }).catch(() => { if (!cancelled) setPosterState("failed"); });
    return () => { cancelled = true; };
  }, [open, source.height, source.url, source.width]);

  useEffect(() => {
    if (!open || !canPublishPreview) return;
    let cancelled = false;
    rasterizeSvgToPng(`/share/${handle}/social.svg?theme=obsidian`, 1200, 630).then(async (blob) => {
      if (cancelled) return;
      await fetch(`/api/share-preview?kind=profile&id=${encodeURIComponent(handle)}&theme=obsidian`, { method: "POST", headers: { "content-type": "image/png" }, body: blob });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [canPublishPreview, handle, open]);

  function selectKind(kind: Extract<ShareContentKind, "profile" | "month">) {
    setContentKind(kind);
    setPosterBlob(null);
    setPosterState("loading");
    setMessage(shareCopy(props, kind));
    setStatus("");
  }

  function selectTheme(theme: ShareTheme) {
    setSelectedTheme(theme);
    setPosterBlob(null);
    setPosterState("loading");
  }

  function openStudio() {
    setPosterBlob(null);
    setPosterState("loading");
    setOpen(true);
  }

  function targetPayload(target: ShareTarget) {
    return { title: shareTitle(props, contentKind), text: message.trim(), url: trackingUrl(canonicalUrl, target, contentKind) };
  }

  async function nativeShare() {
    const target: ShareTarget = "native";
    const payload = targetPayload(target);
    void trackShareEvent(handle, contentKind, target, "target_click");
    try {
      const file = posterBlob ? new File([posterBlob], filename, { type: "image/png" }) : null;
      if (navigator.share) {
        const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
        await navigator.share({ title: payload.title, text: `${payload.text}\n${payload.url}`, url: payload.url, files });
        setStatus(locale === "zh" ? "内容已交给系统分享。" : "Content handed to system share.");
        void trackShareEvent(handle, contentKind, target, "native_handoff");
        return;
      }
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      setStatus(locale === "zh" ? "当前浏览器不支持系统分享，文案和链接已复制。" : "System share is unavailable; copy and link are ready to paste.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(locale === "zh" ? "未能打开系统分享，请使用下方复制或下载操作。" : "Could not open system share. Use a copy or download action below.");
    }
  }

  async function copyText() {
    const payload = targetPayload("copy-text");
    await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
    setStatus(locale === "zh" ? "文案和链接已复制。" : "Copy and link copied.");
    void trackShareEvent(handle, contentKind, "copy-text", "target_click");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(targetPayload("copy-link").url);
    setStatus(locale === "zh" ? "分享链接已复制。" : "Share link copied.");
    void trackShareEvent(handle, contentKind, "copy-link", "target_click");
  }

  async function copyImage() {
    if (!posterBlob || typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      if (posterBlob) triggerPngDownload(posterBlob, filename);
      setStatus(locale === "zh" ? "浏览器不支持复制图片，已改为下载 PNG。" : "Image copy is unavailable, so the PNG was downloaded.");
    } else {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": posterBlob })]);
      setStatus(locale === "zh" ? "PNG 图片已复制。" : "PNG image copied.");
    }
    void trackShareEvent(handle, contentKind, "copy-image", "target_click");
  }

  function download() {
    if (!posterBlob) return;
    triggerPngDownload(posterBlob, filename);
    setStatus(locale === "zh" ? "PNG 图片已下载。" : "PNG image downloaded.");
    void trackShareEvent(handle, contentKind, "download", "target_click");
  }

  const directLinks = useMemo(() => directShareTargets.map((target) => ({
    target,
    href: directShareUrl(target, targetPayload(target)),
    label: targetNames[target],
  })), [canonicalUrl, contentKind, message]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <button className="profile-share-button" onClick={openStudio} ref={triggerButtonRef} type="button">
      <Share2 size={16} />{locale === "zh" ? "分享档案" : "Share profile"}
    </button>
    {open && <div className="share-poster-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <div aria-label={locale === "zh" ? "分享工作室" : "Share studio"} aria-modal="true" className="share-poster-dialog share-studio-dialog" role="dialog">
        <header className="share-poster-head">
          <div><span className="eyebrow">LovTokens</span><h2>{locale === "zh" ? "分享工作室" : "Share studio"}</h2><p>{locale === "zh" ? "选择内容和样式，直接分享图片，或跳转社交平台创建帖子。" : "Choose content and style, share the image directly, or open a social composer."}</p></div>
          <button aria-label={locale === "zh" ? "关闭分享工作室" : "Close share studio"} className="share-poster-close" onClick={() => setOpen(false)} ref={closeButtonRef} type="button"><X size={20} /></button>
        </header>
        <div className="share-poster-body">
          <div className="share-poster-preview" data-landscape={source.width > source.height || undefined}><img alt={`${selected.name} ${source.label}`} height={source.height} src={source.url} width={source.width} /></div>
          <div className="share-poster-controls share-studio-controls">
            <div className="share-studio-scroll">
              <div aria-label={locale === "zh" ? "分享内容" : "Share content"} className="share-kind-switch" role="group">
                <button aria-pressed={contentKind === "profile"} onClick={() => selectKind("profile")} type="button">{locale === "zh" ? "全部档案" : "All time"}</button>
                <button aria-pressed={contentKind === "month"} onClick={() => selectKind("month")} type="button">{locale === "zh" ? "本月战报" : "This month"}</button>
              </div>
              <div aria-label={locale === "zh" ? "海报样式" : "Poster styles"} className="share-poster-themes" role="group">
                {themeOptions.map((theme) => <button aria-pressed={theme.key === selectedTheme} data-selected={theme.key === selectedTheme || undefined} key={theme.key} onClick={() => selectTheme(theme.key)} type="button"><span data-theme={theme.key} /><strong>{theme.name}</strong><small>{theme.key === selectedTheme ? (locale === "zh" ? "已选择" : "Selected") : (locale === "zh" ? "选择" : "Choose")}</small></button>)}
              </div>
              <label className="share-copy-editor"><span>{locale === "zh" ? "分享文案" : "Share copy"}</span><textarea maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={4} value={message} /></label>
              <div className="share-direct-targets">
                {directLinks.map(({ target, href, label }) => <a href={href} key={target} onClick={() => void trackShareEvent(handle, contentKind, target, "target_click")} rel="noopener noreferrer" target="_blank"><span aria-hidden="true">{target === "x" ? "X" : target === "linkedin" ? "in" : target === "facebook" ? "f" : target === "telegram" ? "➤" : "◉"}</span>{label}</a>)}
              </div>
            </div>
            <div className="share-studio-actions">
              <button className="share-native-button" disabled={posterState === "loading"} onClick={nativeShare} type="button"><Send size={16} />{posterState === "loading" ? (locale === "zh" ? "正在准备图片" : "Preparing image") : (locale === "zh" ? "带图片分享" : "Share with image")}</button>
              <div className="share-utility-actions">
                <button onClick={copyText} type="button"><Copy size={14} />{locale === "zh" ? "复制文案" : "Copy text"}</button>
                <button onClick={copyLink} type="button"><Link2 size={14} />{locale === "zh" ? "复制链接" : "Copy link"}</button>
                <button disabled={!posterBlob} onClick={copyImage} type="button"><ImageIcon size={14} />{locale === "zh" ? "复制图片" : "Copy image"}</button>
                <button disabled={!posterBlob} onClick={download} type="button"><Download size={14} />{locale === "zh" ? "下载 PNG" : "Download PNG"}</button>
              </div>
              {status && <p aria-live="polite" className="share-studio-status"><Check size={13} />{status}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>}
  </>;
}

function shareTitle(props: Props, kind: "profile" | "month") {
  if (props.locale === "zh") return kind === "month" ? `${props.displayName} 的本月 AI 编程战报` : `${props.displayName} 的 AI Token 档案`;
  return kind === "month" ? `${props.displayName}'s monthly AI coding recap` : `${props.displayName}'s AI Token portfolio`;
}

function shareCopy(props: Props, kind: "profile" | "month") {
  const details: string[] = [];
  if (kind === "profile" && props.showExactTokens) details.push(props.locale === "zh" ? `累计统计 ${formatTokenCount(props.processedTokens)} AI 编程 Token` : `${formatTokenCount(props.processedTokens)} AI coding tokens measured`);
  if (props.showRank && props.rank > 0) details.push(props.locale === "zh" ? `全球排名 #${props.rank}` : `global rank #${props.rank}`);
  details.push(props.locale === "zh" ? `${props.activeDays} 个活跃日` : `${props.activeDays} active days`);
  if (props.locale === "zh") return kind === "month" ? `这是我的 LovTokens 本月 AI 编程活动战报：${details.join("，")}。` : `这是我的 LovTokens AI Token 档案：${details.join("，")}。`;
  return kind === "month" ? `My LovTokens monthly AI coding recap: ${details.join(", ")}.` : `My LovTokens AI Token portfolio: ${details.join(", ")}.`;
}
