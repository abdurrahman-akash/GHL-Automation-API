import { z } from "zod";

export const connectGhlSchema = z.object({
  locationId: z.string().min(1),
  ghlApiKey: z.string().min(10)
});
