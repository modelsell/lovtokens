interface CloudflareEnv {
  DB: D1Database;
  SHARE_ASSETS: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  PUBLIC_SITE_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  SOCIAL_TOKEN_ENCRYPTION_KEY?: string;
  EMAIL_PASSWORD_AUTH_ENABLED?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  BETTER_AUTH_SECRET?: string;
  CERTIFICATE_PRIVATE_JWK?: string;
  CRON_SECRET?: string;
}
