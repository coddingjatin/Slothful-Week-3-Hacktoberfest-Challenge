import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, createTask, setDone, todayISO, uid, type TaskInput } from "./tasks";
import type { AppData, Energy, Settings, Snippet, Task } from "./types";

export const STORAGE_KEY = "slothful:v1";

export const DEFAULT_SETTINGS: Settings = {
  name: "friend",
  defaultEnergy: "medium",
  availableMinutes: 240,
  provider: "demo",
  endpoint: "http://localhost:11434",
  model: "llama3.2",
  timeoutMs: 60000,
  reduceMotion: false,
};

export function makeSampleData(): AppData {
  const today = todayISO();
  const t = (i: TaskInput) => createTask(i);
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    snippets: [],
    reflections: {},
    tasks: [
      t({ title: "Finish the project synopsis", category: "Work & study", priority: "high", effort: 60, due: today,
        subtasks: [
          { id: uid(), title: "Reread the brief", done: true },
          { id: uid(), title: "Draft the opening paragraph", done: false },
          { id: uid(), title: "Write the methods section", done: false },
        ] }),
      t({ title: "Reply to two important messages", category: "Work & study", priority: "medium", effort: 15, due: today }),
      t({ title: "Review research notes for 15 minutes", category: "Work & study", priority: "medium", effort: 15 }),
      t({ title: "Buy groceries for the week", category: "Home", priority: "low", effort: 30, due: addDays(today, 1) }),
      t({ title: "Clean up the downloads folder", category: "Admin", priority: "low", effort: 10 }),
      t({ title: "Take a short walk outside", category: "Health", priority: "low", effort: 20, due: today }),
      t({ title: "Prepare my project presentation", category: "Work & study", priority: "high", effort: 90, due: addDays(today, 3) }),
    ],
  };
}

export function isAppData(v: unknown): v is AppData {
  const d = v as AppData;
  return !!d && typeof d === "object" && d.version === 1 && Array.isArray(d.tasks) && typeof d.settings === "object";
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isAppData(parsed)) return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings }, snippets: parsed.snippets ?? [], reflections: parsed.reflections ?? {} };
    }
  } catch {
    /* fall through to sample data */
  }
  return makeSampleData();
}

interface Store {
  ready: boolean;
  data: AppData;
  today: string;
  energy: Energy;
  setEnergy: (e: Energy) => void;
  addTask: (i: TaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => Task | undefined;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (t: Task) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setPlan: (p: AppData["plan"]) => void;
  setReflection: (date: string, text: string) => void;
  addSnippet: (title: string, body: string) => void;
  deleteSnippet: (id: string) => void;
  replaceAll: (d: AppData) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => ({ version: 1, tasks: [], settings: DEFAULT_SETTINGS, snippets: [], reflections: {} }));
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setData(load());
    setToday(todayISO());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked */
    }
    document.documentElement.classList.toggle("reduce-motion", data.settings.reduceMotion);
  }, [data, ready]);

  const mutate = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const store = useMemo<Store>(() => {
    const energy = data.todayEnergy?.date === today ? data.todayEnergy.energy : data.settings.defaultEnergy;
    return {
      ready, data, today, energy,
      setEnergy: (e) => mutate((d) => ({ ...d, todayEnergy: { date: today, energy: e } })),
      addTask: (i) => {
        const t = createTask(i);
        mutate((d) => ({ ...d, tasks: [t, ...d.tasks] }));
        return t;
      },
      updateTask: (id, patch) => mutate((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, id } : t)) })),
      toggleTask: (id) => {
        const cur = dataRef.current.tasks.find((t) => t.id === id);
        if (!cur) return undefined;
        const next = setDone(cur, !cur.done);
        mutate((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? next : t)) }));
        return next;
      },
      deleteTask: (id) => {
        const cur = dataRef.current.tasks.find((t) => t.id === id);
        mutate((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id), plan: d.plan && { ...d.plan, items: d.plan.items.filter((i) => i.taskId !== id) } }));
        return cur;
      },
      restoreTask: (t) => mutate((d) => (d.tasks.some((x) => x.id === t.id) ? d : { ...d, tasks: [t, ...d.tasks] })),
      updateSettings: (p) => mutate((d) => ({ ...d, settings: { ...d.settings, ...p } })),
      setPlan: (p) => mutate((d) => ({ ...d, plan: p })),
      setReflection: (date, text) => mutate((d) => ({ ...d, reflections: { ...d.reflections, [date]: text } })),
      addSnippet: (title, body) => {
        const s: Snippet = { id: uid(), title, body, createdAt: new Date().toISOString() };
        mutate((d) => ({ ...d, snippets: [s, ...d.snippets] }));
      },
      deleteSnippet: (id) => mutate((d) => ({ ...d, snippets: d.snippets.filter((s) => s.id !== id) })),
      replaceAll: (d) => setData({ ...d, settings: { ...DEFAULT_SETTINGS, ...d.settings } }),
    };
  }, [data, ready, today, mutate]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
