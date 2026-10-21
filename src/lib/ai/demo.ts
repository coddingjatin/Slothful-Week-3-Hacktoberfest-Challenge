import { addDays } from "../tasks";
import type { InboxResult, ProposedTask } from "./schemas";

const LEAD = /^(?:and\s+|also\s+|then\s+)?(?:i\s+(?:really\s+)?(?:need|have|want|should|must|gotta)\s+to\s+|i\s+should\s+|need\s+to\s+|remember\s+to\s+|don'?t\s+forget\s+to\s+|i\s+must\s+|i'?ll\s+|maybe\s+|to\s+)/i;

const CATEGORY_RULES: [RegExp, string][] = [
  [/assignment|project|report|mentor|email|reply|meeting|presentation|research|synopsis|thesis|study|class|exam|work|client|slides/i, "Work & study"],
  [/clean|groceries|laundry|dishes|buy|cook|tidy|fix|garden|house|room/i, "Home"],
  [/gym|doctor|walk|run|exercise|sleep|meditat|dentist|medicine|water/i, "Health"],
  [/pay|bill|tax|bank|form|renew|insurance|invoice|downloads|folder|backup|password/i, "Admin"],
];

function categorize(t: string) {
  return CATEGORY_RULES.find(([re]) => re.test(t))?.[1] ?? "Personal";
}

function estimate(t: string) {
  if (/reply|text|call|buy|order|book|pay|send|message/i.test(t)) return 10;
  if (/clean|organi[sz]e|tidy|review|read/i.test(t)) return 20;
  if (/finish|write|prepare|assignment|presentation|report|build|study|synopsis/i.test(t)) return 60;
  return 15;
}

function findDue(t: string, today: string): string | null {
  const iso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];
  if (/\btoday\b|\btonight\b/i.test(t)) return today;
  if (/\btomorrow\b/i.test(t)) return addDays(today, 1);
  return null;
}

function cleanTitle(s: string) {
  let t = s.trim().replace(LEAD, "").replace(LEAD, "");
  t = t.replace(/\b(by\s+)?(today|tonight|tomorrow)\b/gi, "").replace(/\s{2,}/g, " ").replace(/[.!?\s]+$/, "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

/** Deterministic, rule-based task extraction used in demo mode. */
export function extractTasksDemo(text: string, today: string): ProposedTask[] {
  const parts = text
    .split(/\s*(?:[,;\n•]|\.\s|\band\s+(?=(?:i\s|also|then|remember|need|[a-z]+\s))|\bthen\b|\balso\b)\s*/i)
    .map((p) => p?.trim())
    .filter(Boolean) as string[];
  const out: ProposedTask[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const title = cleanTitle(part);
    if (title.length < 3 || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    const due = findDue(part, today);
    const effort = estimate(title);
    const important = /urgent|important|asap|deadline/i.test(part);
    out.push({
      title: title.slice(0, 160),
      category: categorize(title),
      priority: important || due === today ? "high" : effort >= 60 ? "medium" : "low",
      effortMinutes: effort,
      due,
      steps: effort >= 60 ? breakdownDemo(title).slice(0, 4) : [],
    });
  }
  return out.slice(0, 30);
}

/** Deterministic step templates used in demo mode. */
export function breakdownDemo(title: string): string[] {
  const t = title.toLowerCase();
  if (/present|slides|deck/.test(t))
    return [
      "Open the existing project notes.",
      "Write down the three main points.",
      "Create the title slide.",
      "Add one slide for the problem.",
      "Stop and review what is done.",
    ];
  if (/reply|email|message|respond/.test(t))
    return [
      "Open the message and read it once.",
      "Write one sentence that answers the main question.",
      "Add a friendly opening and closing.",
      "Send it — good enough is enough.",
    ];
  if (/clean|tidy|organi[sz]e|declutter|downloads|folder/.test(t))
    return [
      "Set a 5-minute timer.",
      "Clear just one small area or the ten newest files.",
      "Delete or put away anything obvious.",
      "Stop when the timer ends and notice the difference.",
    ];
  if (/write|essay|report|assignment|synopsis|paper/.test(t))
    return [
      "Open a blank document and give it a title.",
      "Jot five rough bullet points — no full sentences yet.",
      "Turn the first bullet into a short paragraph.",
      "Do the next bullet only if it feels okay.",
      "Pause and review what you have so far.",
    ];
  return [
    `Open whatever you need for “${title}”. That's the whole first step.`,
    "Write one sentence describing what “done” looks like.",
    "List the three smallest pieces of the work.",
    "Do the first piece only.",
    "Pause and note what's done and what's next.",
  ];
}

/** Deterministic summary used in demo mode. Not AI. */
export function inboxDemo(text: string): InboxResult {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ").slice(0, 400) || text.slice(0, 300);
  const matters = sentences.filter((s) => /deadline|important|must|need|by\s|due|priority|key|decid/i.test(s)).slice(0, 3);
  const actionRe = /^(?:[-*•]|\d+[.)]|\[ \])\s*|^(?:todo|action)[:\s]/i;
  const verbs = /^(please\s+)?(send|reply|call|email|review|write|book|schedule|prepare|finish|update|check|buy|share|ask|follow|submit|fix|read|draft|confirm)\b/i;
  const actions = new Set<string>();
  for (const l of [...lines, ...sentences]) {
    const stripped = l.replace(actionRe, "").replace(/^please\s+/i, "").trim();
    if (actionRe.test(l) || verbs.test(l) || /\b(need to|should|have to)\b/i.test(l)) {
      const a = cleanTitle(stripped.replace(/^.*?\b(?:need to|should|have to)\s+/i, ""));
      if (a.length > 3) actions.add(a.slice(0, 120));
    }
  }
  return { summary, whatMatters: matters, actions: [...actions].slice(0, 10) };
}
