import type { z } from "zod";
import type { Settings } from "../types";
import { breakdownDemo, extractTasksDemo, inboxDemo } from "./demo";
import { BREAKDOWN_PROMPT, EXTRACT_TASKS_PROMPT, INBOX_PROMPT } from "./prompts";
import { BreakdownSchema, ExtractTasksSchema, InboxSchema, parseModelJson, type InboxResult, type ProposedTask } from "./schemas";

export type AISource = { kind: "model"; model: string } | { kind: "demo" };
export type AIResult<T> = { ok: true; data: T; source: AISource } | { ok: false; error: string };

type AISettings = Pick<Settings, "provider" | "endpoint" | "model" | "timeoutMs">;

function base(endpoint: string) {
  return endpoint.replace(/\/+$/, "");
}

async function withTimeout<T>(ms: number, signal: AbortSignal | undefined, fn: (s: AbortSignal) => Promise<T>) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException("Timed out", "TimeoutError")), ms);
  const onAbort = () => ctrl.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function describeError(e: unknown, s: AISettings): string {
  if (e instanceof DOMException && e.name === "TimeoutError") return `The model took longer than ${Math.round(s.timeoutMs / 1000)}s to answer.`;
  if (e instanceof DOMException && e.name === "AbortError") return "Cancelled.";
  if (e instanceof TypeError)
    return `Couldn't reach Ollama at ${s.endpoint}. Is it running, and does it allow this site (OLLAMA_ORIGINS)?`;
  return e instanceof Error ? e.message : "Something went wrong talking to the model.";
}

async function chatJSON<T>(s: AISettings, system: string, user: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, signal?: AbortSignal): Promise<AIResult<T>> {
  try {
    const text = await withTimeout(s.timeoutMs, signal, async (sig) => {
      const res = await fetch(`${base(s.endpoint)}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: sig,
        body: JSON.stringify({
          model: s.model,
          stream: false,
          format: "json",
          options: { temperature: 0.2 },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 404) throw new Error(`Model “${s.model}” isn't available. Try: ollama pull ${s.model}`);
        throw new Error(`Ollama returned ${res.status}. ${body.slice(0, 160)}`);
      }
      const json = (await res.json()) as { message?: { content?: string } };
      return json.message?.content ?? "";
    });
    const parsed = parseModelJson(text, schema);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    return { ok: true, data: parsed.data, source: { kind: "model", model: s.model } };
  } catch (e) {
    return { ok: false, error: describeError(e, s) };
  }
}

export async function extractTasks(text: string, today: string, s: AISettings, signal?: AbortSignal): Promise<AIResult<ProposedTask[]>> {
  if (s.provider === "demo") return { ok: true, data: extractTasksDemo(text, today), source: { kind: "demo" } };
  const r = await chatJSON(s, EXTRACT_TASKS_PROMPT(today), text, ExtractTasksSchema, signal);
  return r.ok ? { ...r, data: r.data.tasks } : r;
}

export async function breakdownTask(title: string, notes: string | undefined, s: AISettings, signal?: AbortSignal): Promise<AIResult<string[]>> {
  if (s.provider === "demo") return { ok: true, data: breakdownDemo(title), source: { kind: "demo" } };
  const r = await chatJSON(s, BREAKDOWN_PROMPT, `Task: ${title}${notes ? `\nNotes: ${notes}` : ""}`, BreakdownSchema, signal);
  return r.ok ? { ...r, data: r.data.steps } : r;
}

export async function processInbox(text: string, s: AISettings, signal?: AbortSignal): Promise<AIResult<InboxResult>> {
  if (s.provider === "demo") return { ok: true, data: inboxDemo(text), source: { kind: "demo" } };
  return chatJSON(s, INBOX_PROMPT, text, InboxSchema, signal);
}

export async function testConnection(s: Pick<Settings, "endpoint" | "model">): Promise<{ ok: true; models: string[]; hasModel: boolean } | { ok: false; error: string }> {
  try {
    const res = await withTimeout(5000, undefined, (sig) => fetch(`${base(s.endpoint)}/api/tags`, { signal: sig }));
    if (!res.ok) return { ok: false, error: `Ollama answered with status ${res.status}.` };
    const json = (await res.json()) as { models?: { name: string }[] };
    const models = (json.models ?? []).map((m) => m.name);
    const hasModel = models.some((m) => m === s.model || m.split(":")[0] === s.model.split(":")[0]);
    return { ok: true, models, hasModel };
  } catch (e) {
    return { ok: false, error: describeError(e, { ...s, provider: "ollama", timeoutMs: 5000 }) };
  }
}
