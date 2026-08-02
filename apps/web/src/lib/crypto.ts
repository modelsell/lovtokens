const encoder = new TextEncoder();

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes); crypto.getRandomValues(data); return bytesToHex(data);
}

export function randomUserCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8); crypto.getRandomValues(bytes);
  return `${Array.from(bytes.slice(0, 4), (b) => alphabet[b % alphabet.length]).join("")}-${Array.from(bytes.slice(4), (b) => alphabet[b % alphabet.length]).join("")}`;
}

export function bytesToHex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); }

export async function signPayload(payload: string, privateJwk?: string) {
  const hash = await sha256(payload);
  if (!privateJwk) return { hash, signature: null };
  const key = await crypto.subtle.importKey("jwk", JSON.parse(privateJwk) as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(payload));
  return { hash, signature: toBase64Url(new Uint8Array(signature)) };
}

export async function verifyPayload(payload: string, expectedHash: string, signature?: string | null, privateJwk?: string) {
  if (await sha256(payload) !== expectedHash) return "invalid" as const;
  if (!signature || !privateJwk) return "hash-verified" as const;
  try {
    const privateKey = JSON.parse(privateJwk) as JsonWebKey;
    const publicKey: JsonWebKey = { kty: privateKey.kty, crv: privateKey.crv, x: privateKey.x, y: privateKey.y, ext: true, key_ops: ["verify"] };
    const key = await crypto.subtle.importKey("jwk", publicKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, fromBase64Url(signature), encoder.encode(payload));
    return valid ? "signature-verified" as const : "invalid" as const;
  } catch { return "invalid" as const; }
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function fromBase64Url(value: string) { const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="); const binary = atob(padded); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); }
