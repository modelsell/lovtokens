export const directShareTargets = ["x", "linkedin", "facebook", "telegram", "whatsapp"] as const;
export const shareTargets = ["native", ...directShareTargets, "copy-text", "copy-link", "copy-image", "download"] as const;

export type DirectShareTarget = (typeof directShareTargets)[number];
export type ShareTarget = (typeof shareTargets)[number];
export type ShareContentKind = "profile" | "month" | "certificate";
export type ShareEvent = "modal_open" | "target_click" | "native_handoff" | "landing" | "cta_click" | "signup";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export function trackingUrl(url: string, target: ShareTarget, kind: ShareContentKind) {
  const tracked = new URL(url);
  tracked.searchParams.set("ref", `share_${target}`);
  tracked.searchParams.set("share_kind", kind);
  return tracked.toString();
}

export function directShareUrl(target: DirectShareTarget, payload: SharePayload) {
  const url = encodeURIComponent(payload.url);
  const text = encodeURIComponent(payload.text);
  if (target === "x") return `https://x.com/intent/tweet?text=${text}&url=${url}&hashtags=LovTokens,AICoding`;
  if (target === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if (target === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if (target === "telegram") return `https://t.me/share/url?url=${url}&text=${text}`;
  return `https://wa.me/?text=${encodeURIComponent(`${payload.text}\n${payload.url}`)}`;
}

export function shareTargetFromRef(value: string | null): ShareTarget | null {
  if (!value?.startsWith("share_")) return null;
  const target = value.slice(6) as ShareTarget;
  return shareTargets.includes(target) ? target : null;
}
