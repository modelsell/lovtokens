export function safeReturnTo(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) return fallback;
  try {
    const parsed = new URL(value, "https://lovtokens.local");
    return parsed.origin === "https://lovtokens.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}
