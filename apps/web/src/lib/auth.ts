import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import { authSchema } from "./db/schema";
import { resolveAuthMethods } from "./auth-options";
import { authEmail, hasEmailDelivery, sendAuthEmail } from "./mailer";
import { getD1, getRuntimeEnv, siteUrl } from "./runtime";

export async function getAuth() {
  const binding = await getD1();
  if (!binding) throw new Error("LovTokens authentication requires the D1 binding.");
  const env = await getRuntimeEnv();
  const methods = resolveAuthMethods(env, siteUrl());
  const emailDelivery = hasEmailDelivery(env);
  return betterAuth({
    appName: "LovTokens",
    baseURL: siteUrl(),
    secret: env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "development-only-secret-change-before-production",
    database: drizzleAdapter(drizzle(binding), { provider: "sqlite", schema: authSchema }),
    emailAndPassword: {
      enabled: methods.emailPassword,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: emailDelivery,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: emailDelivery ? async ({ user, url }) => {
        await sendAuthEmail(env, { to: user.email, ...authEmail("reset", url) });
      } : undefined,
    },
    emailVerification: emailDelivery ? {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthEmail(env, { to: user.email, ...authEmail("verify", url) });
      },
    } : undefined,
    socialProviders: methods.github ? {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        scope: ["read:user", "user:email"],
      },
    } : {},
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
  });
}

export async function getSession(headers: Headers) {
  try {
    const auth = await getAuth();
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}
