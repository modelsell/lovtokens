import { siteUrl } from "@/lib/runtime";

export function GET() {
  const root = siteUrl();
  return new Response(`# LovTokens

> Your AI Token Portfolio. An independent, privacy-first activity counter for Codex, Claude Code, and WorkBuddy.

## Core URLs
- ${root}/agent-register.md
- ${root}/leaderboard
- ${root}/methodology
- ${root}/privacy
- ${root}/docs
- ${root}/compare/codex-vs-claude-code-token-usage

## Counting rule
Processed tokens equal complete input plus output. Cache is an input component; reasoning is an output component. Neither is double-counted. Missing events are marked as partial coverage and never estimated.

## Data boundary
LovTokens does not upload prompts, responses, tool output, code, file paths, repository names, API keys or raw logs.

## Interpretation
Usage is not a productivity, skill, impact or code-quality score. LovTokens is not affiliated with OpenAI, Anthropic, or Tencent.
`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public,max-age=3600" } });
}
