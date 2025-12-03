import { z } from "zod";

export const userGetSchema = z.object({
  userId: z.string().optional(),
});

export const balanceUpdateSchema = z.object({
  amount: z.number().int().min(1),
  type: z.enum(["deposit", "withdraw"]),
});

export const leadUploadSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, "Телефон должен быть в формате +7XXXXXXXXXX"),
  comment: z.string().optional(),
  region: z.string().optional(),
});

export const leadBatchUploadSchema = z.object({
  rawText: z.string().min(1, "Текст не может быть пустым"),
  niche: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().optional(),
});

export const leadBuySchema = z.object({
  leadId: z.string(),
  userId: z.string().optional(),
});

export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

