"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  mediaProposalSchema,
  type MediaProposalFormValues,
} from "@/components/partner/media-proposal-schema";
import { MediaType, ProposalStatus, Role } from "@prisma/client";
import { reviewProposalById } from "@/lib/ai/reviewProposal";
import { ZodError } from "zod";

async function ensureDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Missing email");

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    null;

  const dbUser =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ??
    (await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        role: Role.PARTNER,
      },
    }));

  return dbUser;
}

export async function createMediaProposal(input: unknown) {
  const t = await getTranslations("dashboard.partner");
  let dbUser;
  try {
    dbUser = await ensureDbUser();
  } catch {
    throw new Error(t("errors.submit_failed"));
  }
  if (dbUser.role !== Role.PARTNER) {
    throw new Error(t("errors.submit_failed"));
  }

  let parsed: MediaProposalFormValues;
  try {
    parsed = mediaProposalSchema.parse(input);
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.errors[0];
      const key = first?.message;
      const msg =
        typeof key === "string" && key.startsWith("errors.")
          ? t(key as `errors.${string}`)
          : first
            ? `${first.path.join(".")}: ${first.message}`
            : String((e as Error).message);
      throw new Error(msg);
    }
    throw new Error(t("errors.submit_failed"));
  }

  const location = parsed.location as { lat: number; lng: number; address: string };
  const size = parsed.size && parsed.size.trim() !== "" ? parsed.size.trim() : null;

  const created = await prisma.mediaProposal.create({
    data: {
      userId: dbUser.id,
      title: parsed.title,
      description: parsed.description,
      location,
      mediaType: parsed.mediaType as unknown as MediaType,
      size,
      priceMin: parsed.priceMin,
      priceMax: parsed.priceMax,
      images: parsed.imageUrls,
      status: ProposalStatus.PENDING,
    },
  });

  // Trigger AI review immediately after creation.
  // (If no AI key is set, this will throw and the proposal remains PENDING.)
  try {
    await reviewProposalById(created.id);
  } catch {
    // keep PENDING if review fails
  }

  return { id: created.id };
}

