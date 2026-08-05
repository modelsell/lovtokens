const repositoryApiUrl = "https://api.github.com/repos/modelsell/lovtokens";

export async function getGitHubStarCount(): Promise<number | null> {
  try {
    const response = await fetch(repositoryApiUrl, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "LovTokens",
      },
      next: { revalidate: 3_600 },
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) return null;
    const data = await response.json() as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" && Number.isSafeInteger(data.stargazers_count) && data.stargazers_count >= 0
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}
