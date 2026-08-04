"use client";

import type { ShareContentKind, ShareEvent, ShareTarget } from "./share-targets";

const attributionKey = "lovtokens-share-attribution-v1";

export type ShareAttribution = {
  contentId: string;
  contentKind: ShareContentKind;
  target: ShareTarget;
  createdAt: number;
  registrationStarted?: boolean;
};

export function trackShareEvent(contentId: string, contentKind: ShareContentKind, target: ShareTarget, event: ShareEvent) {
  return fetch("/api/share-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentId, contentKind, target, event }),
    keepalive: true,
  }).catch(() => undefined);
}

export function rememberShareAttribution(attribution: Omit<ShareAttribution, "createdAt">) {
  try { localStorage.setItem(attributionKey, JSON.stringify({ ...attribution, createdAt: Date.now() })); } catch { /* Storage can be disabled. */ }
}

export function markShareRegistrationStarted() {
  const attribution = readShareAttribution();
  if (!attribution) return;
  try { localStorage.setItem(attributionKey, JSON.stringify({ ...attribution, registrationStarted: true })); } catch { /* Storage can be disabled. */ }
}

export async function completeShareSignupAttribution() {
  const attribution = readShareAttribution();
  if (!attribution?.registrationStarted) return;
  await trackShareEvent(attribution.contentId, attribution.contentKind, attribution.target, "signup");
  try { localStorage.removeItem(attributionKey); } catch { /* Storage can be disabled. */ }
}

function readShareAttribution(): ShareAttribution | null {
  try {
    const raw = localStorage.getItem(attributionKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as ShareAttribution;
    if (!value.createdAt || Date.now() - value.createdAt > 7 * 86_400_000) {
      localStorage.removeItem(attributionKey);
      return null;
    }
    return value;
  } catch { return null; }
}
