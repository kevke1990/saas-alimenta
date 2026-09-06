import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(2).max(100),
  companyName: z.string().max(150).optional()
});

export const clientSchema = z.object({
  name: z.string().min(2).max(150),
  reference: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional()
});
