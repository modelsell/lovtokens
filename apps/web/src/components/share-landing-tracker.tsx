"use client";

import { useEffect } from "react";
import { rememberShareAttribution, trackShareEvent } from "@/lib/share-analytics";
import { shareTargetFromRef, type ShareContentKind } from "@/lib/share-targets";

export function ShareLandingTracker({ contentId, contentKind, conversionSelector }: { contentId: string; contentKind: ShareContentKind; conversionSelector: string }) {
  useEffect(() => {
    const target = shareTargetFromRef(new URLSearchParams(location.search).get("ref"));
    if (!target) return;
    const key = `lovtokens-share-landing:${contentKind}:${contentId}:${target}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      void trackShareEvent(contentId, contentKind, target, "landing");
    }
    rememberShareAttribution({ contentId, contentKind, target });
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest(conversionSelector)) void trackShareEvent(contentId, contentKind, target, "cta_click");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [contentId, contentKind, conversionSelector]);
  return null;
}
