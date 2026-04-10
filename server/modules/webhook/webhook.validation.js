import { z } from "zod";

export const webhookContactSchema = z.object({
  id: z.string().optional(),
  contactId: z.string().optional(),
  locationId: z.string().min(1).optional(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});

export const webhookEventSchema = z.object({
  type: z.string().optional(),
  contact: webhookContactSchema.optional(),
  locationId: z.string().optional(),
  id: z.string().optional(),
  contactId: z.string().optional(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});
