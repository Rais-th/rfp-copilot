import { z } from "zod";

export const BusinessProfileSchema = z.object({
  businessName: z.string().min(1),
  contactName: z.string().optional().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")),
  yearsInBusiness: z.number().int().min(0).max(200).optional(),
  teamSize: z.number().int().min(0).max(100000).optional(),
  naicsCodes: z.array(z.string()).default([]),
  certifications: z
    .array(
      z.enum([
        "MBE",
        "WBE",
        "DBE",
        "8a",
        "HUBZone",
        "VOSB",
        "SDVOSB",
        "LGBTBE",
        "None",
      ]),
    )
    .default([]),
  keyPersonnel: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        credentials: z.string().optional().default(""),
      }),
    )
    .default([]),
  pastWork: z
    .array(
      z.object({
        title: z.string(),
        client: z.string(),
        value: z.string().optional().default(""),
        year: z.string().optional().default(""),
        summary: z.string().optional().default(""),
      }),
    )
    .default([]),
  capabilities: z.string().default(""),
  differentiators: z.string().default(""),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
