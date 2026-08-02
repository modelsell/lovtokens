import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getSession } from "./auth";
import { getPrivateSummary } from "./private-repository";

export type Viewer = Awaited<ReturnType<typeof getViewer>>;

export const getViewer = cache(async () => {
  const session = await getSession(await headers());
  if (!session?.user) return null;
  const summary = await getPrivateSummary(session.user.id);

  return {
    session: { id: session.session.id },
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image || null,
    },
    profile: summary?.profile ? {
      handle: String(summary.profile.handle),
      isPublic: Boolean(summary.profile.is_public),
      showRank: Boolean(summary.profile.show_rank),
    } : null,
    stats: {
      total: summary?.total || 0,
      month: summary?.month || 0,
      today: summary?.today || 0,
      activeDays: summary?.activeDays || 0,
    },
    devices: {
      active: summary?.activeDevices || 0,
      lastSyncedAt: summary?.lastSyncedAt || null,
    },
  };
});
