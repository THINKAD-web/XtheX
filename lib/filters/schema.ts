import { z } from "zod";

export const FilterGroupSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  logic: z.enum(["AND", "OR"]),
  /** Empty while user is still building the filter in the UI */
  tags: z.array(z.string()).default([]),
});

export const AdvancedFilterSchema = z.object({
  /** Empty before any group is added, or cleared — treated as no filter */
  groups: z.array(FilterGroupSchema).default([]),
});

export type FilterGroup = z.infer<typeof FilterGroupSchema>;
export type AdvancedFilter = z.infer<typeof AdvancedFilterSchema>;

