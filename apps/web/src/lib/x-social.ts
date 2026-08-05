import { sha256 } from "@/lib/crypto";
import { safeReturnTo } from "@/lib/redirect";
import { getD1, getRuntimeEnv, siteUrl } from "@/lib/runtime";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const scopes = ["tweet.read", "tweet.write", "users.read", "media.write", "offline.access"];

type XConfig = { clientId: string; clientSecret: string; encryptionSecret: string; callbackUrl: string };
type TokenResponse = { token_type: string; expires_in?: number; access_token: string; scope?: string; refresh_token?: string };
type ConnectionRow = {
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: number | null;
  scope: string;
};

export class XSocialError extends Error {
  constructor(public code: "not_configured" | "not_connected" | "oauth_failed" | "publish_failed", message: string, public status = 400) { super(message); }
}

export async function xConfig(): Promise<XConfig> {
  const env = await getRuntimeEnv();
  const clientId = env.X_CLIENT_ID?.trim();
  const clientSecret = env.X_CLIENT_SECRET?.trim();
  const encryptionSecret = env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
  if (!clientId || !clientSecret || !encryptionSecret || encryptionSecret.length < 32) throw new XSocialError("not_configured", "X publishing is not configured.", 503);
  return { clientId, clientSecret, encryptionSecret, callbackUrl: `${siteUrl()}/api/social/x/callback` };
}

export async function beginXConnection(userId: string, requestedReturnTo?: string) {
  const [config, db] = await Promise.all([xConfig(), getD1()]);
  if (!db) throw new XSocialError("not_configured", "The social connection store is unavailable.", 503);
  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const challenge = toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
  const now = Math.floor(Date.now() / 1000);
  const returnTo = safeReturnTo(requestedReturnTo, "/dashboard");
  await db.prepare("DELETE FROM social_oauth_states WHERE expires_at<?1").bind(now).run();
  await db.prepare("INSERT INTO social_oauth_states (state_hash,user_id,provider,code_verifier_encrypted,return_to,expires_at,created_at) VALUES (?1,?2,'x',?3,?4,?5,?6)")
    .bind(await sha256(state), userId, await encryptSecret(verifier, config.encryptionSecret), returnTo, now + 600, now).run();
  const authorize = new URL("https://x.com/i/oauth2/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("redirect_uri", config.callbackUrl);
  authorize.searchParams.set("scope", scopes.join(" "));
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  return authorize.toString();
}

export async function finishXConnection(userId: string, state: string, code: string) {
  const [config, db] = await Promise.all([xConfig(), getD1()]);
  if (!db) throw new XSocialError("not_configured", "The social connection store is unavailable.", 503);
  const stateHash = await sha256(state);
  const row = await db.prepare("SELECT user_id,code_verifier_encrypted,return_to,expires_at FROM social_oauth_states WHERE state_hash=?1 AND provider='x'")
    .bind(stateHash).first<{ user_id: string; code_verifier_encrypted: string; return_to: string; expires_at: number }>();
  await db.prepare("DELETE FROM social_oauth_states WHERE state_hash=?1").bind(stateHash).run();
  const now = Math.floor(Date.now() / 1000);
  if (!row || row.user_id !== userId || Number(row.expires_at) < now) throw new XSocialError("oauth_failed", "The X authorization request expired or did not match.", 400);
  const verifier = await decryptSecret(row.code_verifier_encrypted, config.encryptionSecret);
  const token = await requestToken(config, new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: config.callbackUrl, code_verifier: verifier }));
  const identityResponse = await fetch("https://api.x.com/2/users/me?user.fields=username,name", { headers: { authorization: `Bearer ${token.access_token}` } });
  const identity = await readXResponse<{ data?: { id?: string; username?: string } }>(identityResponse, "Unable to read the connected X account.");
  if (!identity.data?.id) throw new XSocialError("oauth_failed", "X did not return an account identity.", 502);
  const expiresAt = token.expires_in ? now + token.expires_in : null;
  await db.prepare(`INSERT INTO social_connections (user_id,provider,provider_user_id,provider_username,access_token_encrypted,refresh_token_encrypted,token_expires_at,scope,created_at,updated_at)
    VALUES (?1,'x',?2,?3,?4,?5,?6,?7,?8,?8)
    ON CONFLICT(user_id,provider) DO UPDATE SET provider_user_id=excluded.provider_user_id,provider_username=excluded.provider_username,access_token_encrypted=excluded.access_token_encrypted,refresh_token_encrypted=excluded.refresh_token_encrypted,token_expires_at=excluded.token_expires_at,scope=excluded.scope,updated_at=excluded.updated_at`)
    .bind(userId, identity.data.id, identity.data.username || null, await encryptSecret(token.access_token, config.encryptionSecret), token.refresh_token ? await encryptSecret(token.refresh_token, config.encryptionSecret) : null, expiresAt, token.scope || scopes.join(" "), now).run();
  return safeReturnTo(row.return_to, "/dashboard");
}

export async function publishPngToX(userId: string, png: Uint8Array, text: string) {
  const [config, db] = await Promise.all([xConfig(), getD1()]);
  if (!db) throw new XSocialError("not_configured", "The social connection store is unavailable.", 503);
  const connection = await db.prepare("SELECT access_token_encrypted,refresh_token_encrypted,token_expires_at,scope FROM social_connections WHERE user_id=?1 AND provider='x'")
    .bind(userId).first<ConnectionRow>();
  if (!connection) throw new XSocialError("not_connected", "Connect an X account before publishing.", 409);
  const accessToken = await validAccessToken(userId, connection, config, db);
  const mediaResponse = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ media: bytesToBase64(png), media_category: "tweet_image", media_type: "image/png", shared: false }),
  });
  const media = await readXResponse<{ data?: { id?: string } }>(mediaResponse, "X rejected the image upload.");
  if (!media.data?.id) throw new XSocialError("publish_failed", "X did not return a media identifier.", 502);
  const postResponse = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ text, media: { media_ids: [media.data.id] } }),
  });
  const post = await readXResponse<{ data?: { id?: string; text?: string } }>(postResponse, "X rejected the post.");
  if (!post.data?.id) throw new XSocialError("publish_failed", "X did not return a post identifier.", 502);
  return { id: post.data.id, url: `https://x.com/i/web/status/${post.data.id}` };
}

export async function disconnectX(userId: string) {
  const db = await getD1();
  if (!db) throw new XSocialError("not_configured", "The social connection store is unavailable.", 503);
  await db.prepare("DELETE FROM social_connections WHERE user_id=?1 AND provider='x'").bind(userId).run();
}

async function validAccessToken(userId: string, connection: ConnectionRow, config: XConfig, db: D1Database) {
  const now = Math.floor(Date.now() / 1000);
  if (!connection.token_expires_at || Number(connection.token_expires_at) > now + 60) return decryptSecret(connection.access_token_encrypted, config.encryptionSecret);
  if (!connection.refresh_token_encrypted) throw new XSocialError("not_connected", "Reconnect X to renew publishing access.", 409);
  const refreshToken = await decryptSecret(connection.refresh_token_encrypted, config.encryptionSecret);
  const token = await requestToken(config, new URLSearchParams({ refresh_token: refreshToken, grant_type: "refresh_token" }));
  const expiresAt = token.expires_in ? now + token.expires_in : null;
  await db.prepare("UPDATE social_connections SET access_token_encrypted=?1,refresh_token_encrypted=?2,token_expires_at=?3,scope=?4,updated_at=?5 WHERE user_id=?6 AND provider='x'")
    .bind(await encryptSecret(token.access_token, config.encryptionSecret), token.refresh_token ? await encryptSecret(token.refresh_token, config.encryptionSecret) : connection.refresh_token_encrypted, expiresAt, token.scope || connection.scope, now, userId).run();
  return token.access_token;
}

async function requestToken(config: XConfig, params: URLSearchParams) {
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  let body: (TokenResponse & { detail?: string; title?: string }) | null = null;
  try { body = await response.json() as TokenResponse & { detail?: string; title?: string }; } catch { /* X may return a non-JSON gateway error. */ }
  if (!response.ok || !body?.access_token) throw new XSocialError("oauth_failed", body?.detail || body?.title || "X authorization token exchange failed.", 502);
  return body;
}

async function readXResponse<T>(response: Response, fallback: string): Promise<T> {
  let body: (T & { detail?: string; title?: string }) | null = null;
  try { body = await response.json() as T & { detail?: string; title?: string }; } catch { /* X may return a non-JSON gateway error. */ }
  if (!response.ok) throw new XSocialError(response.status === 401 || response.status === 403 ? "not_connected" : "publish_failed", body?.detail || body?.title || fallback, response.status === 401 || response.status === 403 ? 409 : 502);
  if (!body) throw new XSocialError("publish_failed", fallback, 502);
  return body;
}

export async function encryptSecret(value: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value)));
  return `v1.${toBase64Url(iv)}.${toBase64Url(encrypted)}`;
}

export async function decryptSecret(value: string, secret: string) {
  const [version, iv, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !encrypted) throw new XSocialError("not_connected", "The stored X connection is invalid.", 409);
  try {
    const key = await encryptionKey(secret);
    const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(iv) }, key, fromBase64Url(encrypted));
    return decoder.decode(clear);
  } catch { throw new XSocialError("not_connected", "The stored X connection could not be decrypted. Reconnect X.", 409); }
}

async function encryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function randomBase64Url(bytes: number) { return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes))); }
function toBase64Url(bytes: Uint8Array) { let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); }
function fromBase64Url(value: string) { const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="); const binary = atob(padded); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); }
function bytesToBase64(bytes: Uint8Array) { let binary = ""; const size = 0x8000; for (let offset = 0; offset < bytes.length; offset += size) binary += String.fromCharCode(...bytes.subarray(offset, offset + size)); return btoa(binary); }
