import { addDays } from "./tasks";
import type { Energy, PlanItem, Task } from "./types";

/** Share of available time we are willing to fill, leaving breathing room. */
export const FILL_RATIO: Record<Energy, number> = { low: 0.6, medium: 0.75, high: 0.8 };
const MAX_ITEMS: Record<Energy, number> = { low: 3, medium: 5, high: 6 };

export function scoreTask(t: Task, energy: Energy, today: string) {
  let s = 0;
  if (t.due) {
    if (t.due <= today) s += 4;
    else if (t.due <= addDays(today, 2)) s += 2;
    else if (t.due <= addDays(today, 7)) s += 0.5;
  }
  s += t.priority === "high" ? 2.5 : t.priority === "medium" ? 1 : 0;
  if (energy === "low") s += t.effort <= 15 ? 3 : t.effort <= 30 ? 0 : -3;
  if (energy === "medium") s += t.effort <= 15 ? 1 : 0;
  if (energy === "high") s += t.effort >= 30 ? 1.5 : 0;
  return s;
}

export interface PlanResult {
  items: PlanItem[];
  budget: number;
  used: number;
}

export function buildPlan(tasks: Task[], energy: Energy, availableMinutes: number, today: string): PlanResult {
  const budget = Math.floor(Math.max(0, availableMinutes) * FILL_RATIO[energy]);
  const ranked = tasks
    .filter((t) => !t.done)
    .map((t) => ({ t, s: scoreTask(t, energy, today) }))
    .sort((a, b) => b.s - a.s || a.t.effort - b.t.effort);

  const picked: Task[] = [];
  let used = 0;
  for (const { t } of ranked) {
    if (picked.length >= MAX_ITEMS[energy]) break;
    if (used + t.effort > budget) continue;
    picked.push(t);
    used += t.effort;
  }

  let ordered = picked;
  if (energy === "low") ordered = [...picked].sort((a, b) => a.effort - b.effort);
  if (energy === "medium" && picked.length > 1) {
    const quick = [...picked].sort((a, b) => a.effort - b.effort)[0];
    if (quick) ordered = [quick, ...picked.filter((t) => t !== quick)];
  }

  return {
    items: ordered.map((t) => ({ taskId: t.id, minutes: t.effort, status: "suggested" })),
    budget,
    used,
  };
}
