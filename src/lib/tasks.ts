import type { Priority, Task } from "./types";

export function uid() {
  return crypto.randomUUID();
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number) {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}

export function todayISO() {
  return toISODate(new Date());
}

export type TaskInput = Partial<Omit<Task, "id" | "createdAt">> & { title: string };

export function createTask(input: TaskInput): Task {
  const title = input.title.trim();
  if (!title) throw new Error("A task needs a title");
  return {
    id: uid(),
    title,
    notes: input.notes,
    category: input.category?.trim() || "Personal",
    priority: input.priority ?? "medium",
    effort: Math.max(5, Math.round(input.effort ?? 15)),
    due: input.due || undefined,
    done: input.done ?? false,
    completedAt: input.completedAt,
    createdAt: new Date().toISOString(),
    subtasks: input.subtasks ?? [],
  };
}

export function setDone(task: Task, done: boolean): Task {
  return { ...task, done, completedAt: done ? new Date().toISOString() : undefined };
}

export type TaskFilter = "today" | "upcoming" | "completed" | "all";

export function matchesFilter(t: Task, filter: TaskFilter, today: string) {
  switch (filter) {
    case "today":
      return !t.done && !!t.due && t.due <= today;
    case "upcoming":
      return !t.done && !!t.due && t.due > today;
    case "completed":
      return t.done;
    default:
      return true;
  }
}

export function filterTasks(
  tasks: Task[],
  opts: { filter: TaskFilter; query?: string; category?: string; today: string },
) {
  const q = opts.query?.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      matchesFilter(t, opts.filter, opts.today) &&
      (!opts.category || t.category === opts.category) &&
      (!q ||
        t.title.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)),
  );
}

export type TaskSort = "smart" | "due" | "priority" | "effort" | "created";
const PR: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks: Task[], sort: TaskSort) {
  const due = (t: Task) => t.due ?? "9999-12-31";
  const list = [...tasks];
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    switch (sort) {
      case "due":
        return due(a).localeCompare(due(b));
      case "priority":
        return PR[a.priority] - PR[b.priority];
      case "effort":
        return a.effort - b.effort;
      case "created":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return due(a).localeCompare(due(b)) || PR[a.priority] - PR[b.priority] || a.effort - b.effort;
    }
  });
  return list;
}

export function formatEffort(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDue(due: string, today: string) {
  if (due === today) return "Today";
  if (due === addDays(today, 1)) return "Tomorrow";
  if (due < today) return "Earlier";
  const [y = 1970, m = 1, d = 1] = due.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
