import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { breakdownTask, type AISource } from "@/lib/ai/provider";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { SourceBadge } from "./bits";

export function BreakdownDialog({ task, onOpenChange }: { task?: Task | undefined; onOpenChange: (o: boolean) => void }) {
  const { data, updateTask, updateSettings } = useStore();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [steps, setSteps] = useState<string[]>([]);
  const [source, setSource] = useState<AISource | null>(null);
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  async function run(forceDemo = false) {
    if (!task) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState("loading");
    const s = forceDemo ? { ...data.settings, provider: "demo" as const } : data.settings;
    const r = await breakdownTask(task.title, task.notes, s, c.signal);
    if (c.signal.aborted) return;
    if (r.ok) {
      setSteps(r.data);
      setSource(r.source);
      setState("done");
    } else {
      setError(r.error);
      setState("error");
    }
  }

  useEffect(() => {
    if (task) void run();
    return () => ctrl.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  function save() {
    if (!task) return;
    const clean = steps.map((s) => s.trim()).filter(Boolean);
    updateTask(task.id, { subtasks: [...task.subtasks, ...clean.map((title) => ({ id: uid(), title, done: false }))] });
    toast.success("Steps added. Just start with the first one.");
    onOpenChange(false);
  }

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">Make it easier</DialogTitle>
          <DialogDescription>{task?.title}</DialogDescription>
        </DialogHeader>
        {state === "loading" && (
          <div className="grid gap-2" aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Finding a gentle first step…</p>
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />)}
            <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => { ctrl.current?.abort(); setState("idle"); }}>Cancel</Button>
          </div>
        )}
        {state === "error" && (
          <div className="rounded-md border border-destructive/30 bg-terracotta-soft p-3 text-sm">
            <p className="mb-3">{error}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => run()}>Try again</Button>
              <Button size="sm" onClick={() => run(true)}>Use demo steps this time</Button>
              <Button size="sm" variant="ghost" onClick={() => { updateSettings({ provider: "demo" }); run(true); }}>Switch to demo mode</Button>
            </div>
          </div>
        )}
        {state === "idle" && <Button onClick={() => run()}><Sparkles /> Suggest steps</Button>}
        {state === "done" && (
          <div className="grid gap-3">
            {source && <SourceBadge source={source} />}
            <ol className="grid gap-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right font-serif text-muted-foreground">{i + 1}</span>
                  <input className="field" aria-label={`Step ${i + 1}`} value={s} onChange={(e) => setSteps((all) => all.map((x, j) => (j === i ? e.target.value : x)))} />
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">Edit anything that doesn't fit. These are suggestions until you add them.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          {state === "done" && <Button onClick={save}>Add as steps</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
