import { z } from "zod";

const optionalEmail = z.string().email().optional().or(z.literal(""));
const gender = z.enum(["MAN", "VROUW", "ANDERS", "ONBEKEND"]).optional();

export const registerSchema = z.object({
  accountType: z.enum(["PRIVATE", "BUSINESS"]),
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(2).max(100),
  phone: z.string().max(50).optional(),
  addressLine1: z.string().min(3).max(200),
  postalCode: z.string().min(4).max(20),
  city: z.string().min(2).max(100),
  country: z.string().min(2).max(100).default("Nederland"),
  companyName: z.string().max(150).optional(),
  kvkNumber: z.string().max(30).optional(),
  vatNumber: z.string().max(40).optional(),
  website: z.string().url().optional().or(z.literal("")),
  practiceType: z.string().max(100).optional()
}).superRefine((value, ctx) => {
  if (value.accountType === "BUSINESS") {
    if (!value.companyName?.trim()) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Kantoornaam is verplicht voor een zakelijk account." });
    if (!value.kvkNumber?.trim()) ctx.addIssue({ code: "custom", path: ["kvkNumber"], message: "KvK-nummer is verplicht voor een zakelijk account." });
  }
});

export const clientSchema = z.object({
  name: z.string().min(2).max(150),
  reference: z.string().max(100).optional(),
  email: optionalEmail,
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  personAName: z.string().min(2).max(150), personAEmail: optionalEmail, personAPhone: z.string().max(50).optional(), personAGender: gender,
  personBName: z.string().min(2).max(150), personBEmail: optionalEmail, personBPhone: z.string().max(50).optional(), personBGender: gender
});
