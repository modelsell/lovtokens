import { z } from "zod";

export const PROFILE_STATEMENT_MAX_LENGTH = 160;

export const profileSettingsSchema = z.object({
  handle: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,26}[a-z0-9])?$/).optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  statement: z.string().trim().max(PROFILE_STATEMENT_MAX_LENGTH).optional(),
  isPublic: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  showExactTokens: z.boolean().optional(),
  showRank: z.boolean().optional(),
  showAvatar: z.boolean().optional(),
  showModels: z.boolean().optional(),
  showCost: z.boolean().optional(),
});
