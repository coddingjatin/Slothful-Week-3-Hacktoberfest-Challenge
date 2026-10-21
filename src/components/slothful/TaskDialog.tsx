import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { formatEffort, uid } from "@/lib/tasks";
import { DEFAULT_CATEGORIES, EFFORTS, type Priority, type Subtask, type Task } from "@/lib/types";

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | undefined }) {
  const { addTask, updateTask, data } = useStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<Priority>("medium");
  const [effort, setEffort] = useState(15);
  const [due, setDue] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSub, setNewSub] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setCategory(task?.category ?? "Personal");
    setPriority(task?.priority ?? "medium");
    setEffort(task?.effort ?? 15);
    setDue(task?.due ?? "");
    setSubtasks(task?.subtasks ?? []);
    setNewSub("");
    setError("");
  }, [open, task]);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...data.tasks.map((t) => t.category)]));
  const efforts = EFFORTS.includes(effort) ? EFFORTS : [...EFFORTS, effort].sort((a, b) => a - b);

  function save() {
    if (!title.trim()) return setError("Give it a short title.");
    const payload = { title: title.trim(), notes: notes.trim() || undefined, category, priority, effort, due: due || undefined, subtasks };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    onOpenChange(false);
  }

  function addSub() {
    if (!newSub.trim()) return;
    setSubtasks((s) => [...s, { id: uid(), title: newSub.trim(), done: false }]);
    setNewSub("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>Keep it small. You can always break it down later.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="grid gap-1.5 text-sm">
            Title
            <input autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reply to my mentor" />
            {error && <span className="text-xs text-destructive">{error}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-sm">
              Category
              <input className="field" list="cat-list" value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="grid gap-1.5 text-sm">
              Priority
              <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              Effort
              <select className="field" value={effort} onChange={(e) => setEffort(Number(e.target.value))}>
                {efforts.map((m) => <option key={m} value={m}>{formatEffort(m)}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              Due date <span className="sr-only">(optional)</span>
              <input type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm">
            Notes
            <textarea className="field min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>
          <div className="grid gap-2 text-sm">
            <span>Small steps</span>
            {subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <input className="field" value={s.title} onChange={(e) => setSubtasks((all) => all.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))} aria-label="Step" />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove step" onClick={() => setSubtasks((all) => all.filter((x) => x.id !== s.id))}>
                  <X />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <input className="field" value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Add a step"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} />
              <Button type="button" variant="outline" onClick={addSub}><Plus /> Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
