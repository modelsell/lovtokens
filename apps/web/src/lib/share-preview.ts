export const shareThemes = ["obsidian", "terminal", "ivory", "aurora"] as const;
export type ShareTheme = (typeof shareThemes)[number];
export const certificateStyles = ["collector", "archive"] as const;
export type CertificateStyle = (typeof certificateStyles)[number];

export function profilePreviewKey(handle: string, statsVersion: number, privacyVersion: number, theme: ShareTheme) {
  return `social-v1/profile/${handle}/${statsVersion}-${privacyVersion}/${theme}.png`;
}

export function certificatePreviewKey(id: string, issuedAt: number, status: string, locale: "en" | "zh", style: CertificateStyle) {
  return `social-v1/certificate/${id}/${issuedAt}-${status}/${locale}/${style}.png`;
}

export function validPng(bytes: Uint8Array, width: number, height: number) {
  if (bytes.length < 33) return false;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => bytes[index] === value)) return false;
  if (String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(16) === width && view.getUint32(20) === height;
}
