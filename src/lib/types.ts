export type Priority = "low" | "medium" | "high";
export type Energy = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string | undefined;
  category: string;
  priority: Priority;
  /** Estimated effort in minutes */
  effort: number;
  /** yyyy-mm-dd, only when the user (or their text) stated one */
  due?: string | undefined;
  done: boolean;
  completedAt?: string | undefined;
  createdAt: string;
  subtasks: Subtask[];
}

export interface PlanItem {
  taskId: string;
  minutes: number;
  status: "suggested" | "accepted";
}

export interface DayPlan {
  date: string;
  energy: Energy;
  minutes: number;
  items: PlanItem[];
}

export interface Snippet {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Settings {
  name: string;
  defaultEnergy: Energy;
  availableMinutes: number;
  provider: "demo" | "ollama";
  endpoint: string;
  model: string;
  timeoutMs: number;
  reduceMotion: boolean;
}

export interface AppData {
  version: 1;
  tasks: Task[];
  settings: Settings;
  snippets: Snippet[];
  plan?: DayPlan | undefined;
  todayEnergy?: { date: string; energy: Energy };
  reflections: Record<string, string>;
}

export const PRIORITIES: Priority[] = ["low", "medium", "high"];
export const EFFORTS = [5, 10, 15, 30, 45, 60, 90, 120];
export const DEFAULT_CATEGORIES = ["Work & study", "Home", "Personal", "Health", "Admin"];
