"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export type SaveCampaignDraftInput = {
  mediaIds: string[];
  channelDooh: boolean;
  channelWeb: boolean;
  channelMobile: boolean;
  name?: string;
};

export type SaveCampaignDraftResult =
  | { ok: true; draftId: string }
  | {
      ok: false;
      error: "at_least_one_channel" | "no_media" | string;
    };

export async function saveCampaignDraft(
  input: SaveCampaignDraftInput,
): Promise<SaveCampaignDraftResult> {
  const { channelDooh, channelWeb, channelMobile, mediaIds, name } = input;
  const selected = [
    channelDooh && "DOOH",
    channelWeb && "Web",
    channelMobile && "Mobile",
  ].filter(Boolean);
  if (selected.length === 0) {
    return { ok: false, error: "at_least_one_channel" as const };
  }
  if (!mediaIds.length) {
    return { ok: false, error: "no_media" as const };
  }

  let userId: string | null = null;
  const session = await getAuthSession();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const draft = await (prisma as any).campaignDraft.create({
    data: {
      userId,
      name: name?.trim() || null,
      channelDooh,
      channelWeb,
      channelMobile,
      mediaIds: mediaIds as unknown as any,
    },
  });

  return { ok: true as const, draftId: String(draft.id) };
}
