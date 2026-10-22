import { z } from "zod";
import { isValidIsoDate } from "@/lib/time";

export const SERVICE_SLUGS = [
  "semipermanent",
  "soft-gel",
  "polygel",
  "rubber-base",
  "builder-gel",
  "dual-system",
  "nail-art",
] as const;

export const serviceSchema = z.enum(SERVICE_SLUGS);
export const dateSchema = z.string().refine(isValidIsoDate, "INVALID_DATE");

const compactText = (max: number) => z.string().trim().min(1).max(max);

export const appointmentSchema = z.object({
  name: compactText(100),
  preferredName: compactText(80),
  phone: z.string().trim().transform((value) => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?\d{8,15}$/)),
  instagram: z.string().trim().max(80).optional().transform((value) => value || undefined),
  service: serviceSchema,
  date: dateSchema,
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  designNotes: z.string().trim().max(1000).optional().transform((value) => value || undefined),
  challengeToken: z.string().trim().min(32).max(1024),
  website: z.string().max(0).optional().default(""),
}).strict();

export type AppointmentInput = z.infer<typeof appointmentSchema>;
