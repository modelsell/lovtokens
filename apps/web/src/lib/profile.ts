import { getD1 } from "./runtime";

export async function ensureProfile(user: { id: string; name: string; email: string; image?: string | null }) {
  const db = await getD1(); if (!db) throw new Error("D1 is not configured");
  const existing = await db.prepare("SELECT handle FROM profiles WHERE user_id=?1").bind(user.id).first<{ handle: string }>();
  if (existing) return existing.handle;
  const base = slugify(user.name || user.email.split("@")[0] || "builder");
  let handle = base;
  for (let index = 0; index < 20; index += 1) {
    const taken = await db.prepare("SELECT 1 found FROM profiles WHERE handle=?1").bind(handle).first();
    if (!taken) break;
    handle = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO profiles (user_id,handle,display_name,avatar_url,is_public,created_at,updated_at) VALUES (?1,?2,?3,?4,0,?5,?5)").bind(user.id, handle, user.name || handle, user.image || null, now).run();
  return handle;
}

export function slugify(input: string) { return input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "builder"; }
