import { z } from "zod";

export const duplicateCheckSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional()
  })
  .refine((input) => Boolean(input.email || input.phone), {
    message: "At least one of email or phone is required"
  });
