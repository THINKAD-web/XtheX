import { CampaignWorkflowStage, CrmEntityType } from "@prisma/client";
import { z } from "zod";

const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "invalid_date");

export const patchWorkflowStageSchema = z.object({
  workflowStage: z.nativeEnum(CampaignWorkflowStage),
});

export const createBroadcastSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startAt: iso,
  endAt: iso,
  campaignId: z.string().uuid().optional().nullable(),
  mediaId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const createCrmNoteSchema = z.object({
  entityType: z.nativeEnum(CrmEntityType),
  entityId: z.string().uuid(),
  body: z.string().trim().min(1).max(8000),
});

export const createAdminTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(4000).optional().nullable(),
  dueAt: iso.optional().nullable(),
  priority: z.coerce.number().int().min(0).max(5).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export const patchAdminTodoSchema = z.object({
  done: z.boolean().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  priority: z.coerce.number().int().min(0).max(5).optional(),
});
