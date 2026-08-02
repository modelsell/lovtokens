type AuthEnvironment = {
  EMAIL_PASSWORD_AUTH_ENABLED?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export function resolveAuthMethods(env: AuthEnvironment, baseURL: string) {
  const emailFlag = env.EMAIL_PASSWORD_AUTH_ENABLED?.trim().toLowerCase() || undefined;
  const emailPassword = emailFlag === "true" || (emailFlag === undefined && isLocalURL(baseURL));

  return {
    emailPassword,
    github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  };
}

function isLocalURL(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
