import { z } from "zod";
import { t, type Locale } from "./i18n";

export const agentVisibilitySchema = z.enum(["private", "summary", "public"]);
export type AgentVisibility = z.infer<typeof agentVisibilitySchema>;

export const agentRegistrationSchema = z.object({
  email: z.email().max(254),
  nickname: z.string().trim().min(1).max(60),
  password: z.string().min(8).max(128),
  visibility: agentVisibilitySchema.default("private"),
  deviceName: z.string().trim().min(1).max(80),
});

export function privacyForVisibility(visibility: AgentVisibility) {
  if (visibility === "summary") {
    return { isPublic: 1, showExactTokens: 0, showRank: 1, showAvatar: 0, showModels: 0, showCost: 0 } as const;
  }
  if (visibility === "public") {
    return { isPublic: 1, showExactTokens: 1, showRank: 1, showAvatar: 0, showModels: 1, showCost: 0 } as const;
  }
  return { isPublic: 0, showExactTokens: 0, showRank: 0, showAvatar: 0, showModels: 0, showCost: 0 } as const;
}

export function agentRegistrationHandoff(site: string, locale: Locale) {
  const documentUrl = `${site}/agent-register.md`;
  return t(locale, "For my current operating system, read and follow {{documentUrl}} to set up LovTokens—my private Codex, Claude Code, and WorkBuddy token usage dashboard—then return the registration and sync results.")
    .replace("{{documentUrl}}", documentUrl);
}
