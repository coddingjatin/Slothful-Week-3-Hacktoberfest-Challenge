import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task } from "@/lib/types";
import { BreakdownDialog } from "./BreakdownDialog";
import { TaskDialog } from "./TaskDialog";

interface UI {
  openTask: (t?: Task) => void;
  openBreakdown: (t: Task) => void;
}
const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [breaking, setBreaking] = useState<Task | undefined>();
  return (
    <Ctx.Provider
      value={{
        openTask: (t) => { setEditing(t); setTaskOpen(true); },
        openBreakdown: (t) => setBreaking(t),
      }}
    >
      {children}
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} task={editing} />
      <BreakdownDialog task={breaking} onOpenChange={(o) => !o && setBreaking(undefined)} />
    </Ctx.Provider>
  );
}

export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI outside provider");
  return c;
}
