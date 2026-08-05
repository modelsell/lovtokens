"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

type Props = {
  blob: Blob | null;
  filename: string;
  locale: Locale;
  text: string;
  url: string;
  onPublished: () => void;
  onStatus: (message: string) => void;
};

export function XPublishButton({ blob, filename, locale, text, url, onPublished, onStatus }: Props) {
  const [publishing, setPublishing] = useState(false);

  async function publish() {
    if (!blob || publishing) return;
    setPublishing(true);
    onStatus(locale === "zh" ? "正在上传图片并发布到 X…" : "Uploading the image and publishing to X…");
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const form = new FormData();
    form.set("image", new File([blob], filename, { type: "image/png" }));
    form.set("text", text.trim());
    form.set("url", url);
    form.set("returnTo", returnTo);
    try {
      const response = await fetch("/api/social/x/publish", { method: "POST", body: form });
      const result = await response.json() as { error?: string; message?: string; connectUrl?: string; post?: { url?: string } };
      if (response.status === 401) {
        window.location.assign(`${localePath("/login", locale)}?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (response.status === 409 && result.connectUrl) {
        window.location.assign(result.connectUrl);
        return;
      }
      if (!response.ok) throw new Error(result.message || (locale === "zh" ? "发布到 X 失败。" : "Could not publish to X."));
      onStatus(locale === "zh" ? "图片已作为媒体附件发布到 X。" : "The image was published to X as a media attachment.");
      onPublished();
    } catch (error) {
      onStatus(error instanceof Error ? error.message : (locale === "zh" ? "发布到 X 失败。" : "Could not publish to X."));
    } finally {
      setPublishing(false);
    }
  }

  return <button className="share-direct-publish" disabled={!blob || publishing} onClick={publish} type="button"><span aria-hidden="true">X</span>{publishing ? (locale === "zh" ? "发布中" : "Publishing") : (locale === "zh" ? "发布图片到 X" : "Publish image to X")}</button>;
}
