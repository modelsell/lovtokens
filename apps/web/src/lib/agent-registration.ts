import { z } from "zod";

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

export function agentRegistrationHandoff(site: string, locale: "en" | "zh") {
  const documentUrl = `${site}/agent-register.md`;
  if (locale === "zh") {
    return `请根据我当前的操作系统，读取并执行 ${documentUrl}，帮我配置 LovTokens——一个统计 Codex 和 Claude Code Token 用量且不上传对话与代码的个人数据看板，完成后把注册和同步结果告诉我。`;
  }

  return `For my current operating system, read and follow ${documentUrl} to set up LovTokens—my private Codex and Claude Code token usage dashboard—then return the registration and sync results.`;
}
