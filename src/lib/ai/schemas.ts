import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullish()
  .catch(null);

export const ProposedTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(40).catch("Personal"),
  priority: z.enum(["low", "medium", "high"]).catch("medium"),
  effortMinutes: z.coerce.number().int().min(5).max(480).catch(15),
  due: isoDate,
  steps: z.array(z.string().trim().min(1)).max(10).catch([]),
});
export type ProposedTask = z.infer<typeof ProposedTaskSchema>;

export const ExtractTasksSchema = z.object({
  tasks: z.array(ProposedTaskSchema).max(30),
});

export const BreakdownSchema = z.object({
  steps: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
});

export const InboxSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  whatMatters: z.array(z.string().trim().min(1)).max(6).catch([]),
  actions: z.array(z.string().trim().min(1)).max(15).catch([]),
});
export type InboxResult = z.infer<typeof InboxSchema>;

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Pulls the first JSON value out of model text (tolerates code fences / prose) and validates it. */
export function parseModelJson<T>(text: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): ParseResult<T> {
  if (!text || !text.trim()) return { ok: false, error: "The model returned an empty response." };
  let raw = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = raw.search(/[[{]/);
  if (start === -1) return { ok: false, error: "The model response did not contain JSON." };
  const open = raw[start];
  const close = open === "{" ? "}" : "]";
  const end = raw.lastIndexOf(close);
  if (end <= start) return { ok: false, error: "The model response had incomplete JSON." };
  raw = raw.slice(start, end + 1);
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: "The model response was not valid JSON." };
  }
  // Accept a bare array for list schemas
  if (Array.isArray(value)) {
    const wrapped = schema.safeParse({ tasks: value });
    if (wrapped.success) return { ok: true, data: wrapped.data };
    const steps = schema.safeParse({ steps: value });
    if (steps.success) return { ok: true, data: steps.data };
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, error: "The model response didn't match the expected shape." };
  return { ok: true, data: parsed.data };
}
