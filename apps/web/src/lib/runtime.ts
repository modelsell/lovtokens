import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getRuntimeEnv(): Promise<Partial<CloudflareEnv>> {
  const processEnv = process.env as unknown as Partial<CloudflareEnv>;
  try {
    const context = await getCloudflareContext({ async: true });
    return { ...processEnv, ...context.env };
  } catch {
    return processEnv;
  }
}

export async function getD1(): Promise<D1Database | null> {
  const env = await getRuntimeEnv();
  return env.DB ?? null;
}

export async function getShareBucket(): Promise<R2Bucket | null> {
  const env = await getRuntimeEnv();
  return env.SHARE_ASSETS ?? null;
}

export function siteUrl() {
  return (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100").replace(/\/$/, "");
}
