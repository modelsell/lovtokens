import { getAuth } from "@/lib/auth";
import { agentRegistrationSchema, privacyForVisibility } from "@/lib/agent-registration";
import { randomToken, sha256 } from "@/lib/crypto";
import { hasEmailDelivery } from "@/lib/mailer";
import { ensureProfile } from "@/lib/profile";
import { getD1, getRuntimeEnv, siteUrl } from "@/lib/runtime";

export async function POST(request: Request) {
  const input = agentRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return Response.json({ error: input.error.issues[0]?.message || "Invalid registration details" }, { status: 400 });
  }

  const db = await getD1();
  if (!db) return Response.json({ error: "D1 is not configured" }, { status: 503 });

  const root = siteUrl();
  const authHeaders = new Headers(request.headers);
  authHeaders.set("origin", root);
  authHeaders.set("host", new URL(root).host);

  let registration: Awaited<ReturnType<(Awaited<ReturnType<typeof getAuth>>)["api"]["signUpEmail"]>>;
  try {
    const auth = await getAuth();
    registration = await auth.api.signUpEmail({
      body: {
        name: input.data.nickname,
        email: input.data.email,
        password: input.data.password,
        callbackURL: `${root}/settings/account`,
        rememberMe: false,
      },
      headers: authHeaders,
    });
  } catch {
    return Response.json({ error: "Could not create account. If this email is already registered, sign in instead." }, { status: 409 });
  }

  const createdUser = await db.prepare("SELECT id,email_verified FROM user WHERE id=?1 AND email=?2")
    .bind(registration.user.id, input.data.email.toLowerCase())
    .first<{ id: string; email_verified: number }>();
  if (!createdUser) {
    return Response.json({ error: "Could not create account. If this email is already registered, sign in instead." }, { status: 409 });
  }

  const deviceId = crypto.randomUUID();
  const deviceToken = randomToken();
  const now = Math.floor(Date.now() / 1000);

  try {
    const handle = await ensureProfile(registration.user);
    const privacy = privacyForVisibility(input.data.visibility);
    const results = await db.batch([
      db.prepare(`UPDATE profiles SET is_public=?1,show_exact_tokens=?2,show_rank=?3,show_avatar=?4,show_models=?5,show_cost=?6,privacy_version=privacy_version+1,updated_at=?7 WHERE user_id=?8`)
        .bind(privacy.isPublic, privacy.showExactTokens, privacy.showRank, privacy.showAvatar, privacy.showModels, privacy.showCost, now, registration.user.id),
      db.prepare("INSERT INTO devices (id,user_id,name,token_hash,status,created_at) VALUES (?1,?2,?3,?4,'active',?5)")
        .bind(deviceId, registration.user.id, input.data.deviceName, await sha256(deviceToken), now),
    ]);
    if (!results[0]?.meta.changes || !results[1]?.meta.changes) throw new Error("Provisioning did not complete");

    const env = await getRuntimeEnv();
    return Response.json({
      ok: true,
      email: input.data.email.toLowerCase(),
      nickname: input.data.nickname,
      handle,
      visibility: input.data.visibility,
      deviceId,
      deviceToken,
      verificationRequired: hasEmailDelivery(env) && !Boolean(createdUser.email_verified),
      loginUrl: `${root}/login`,
      privacySettingsUrl: `${root}/settings/privacy`,
      profileUrl: privacy.isPublic ? `${root}/u/${handle}` : null,
    }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    await db.prepare("DELETE FROM user WHERE id=?1").bind(registration.user.id).run().catch(() => undefined);
    return Response.json({ error: "Account provisioning failed. No usable registration was kept; retry safely." }, { status: 500 });
  }
}
