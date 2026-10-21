import { CalendarDays, Check, ChevronDown, Clock, MoreHorizontal, Pencil, Sprout, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { formatDue, formatEffort } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PriorityDot } from "./bits";
import { useUI } from "./ui-context";

export function TaskCheck({ task }: { task: Task }) {
  const { toggleTask, toggleTask: undo } = useStore();
  return (
    <button
      role="checkbox"
      aria-checked={task.done}
      aria-label={task.done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
      onClick={() => {
        const next = toggleTask(task.id);
        if (next?.done) toast("Nicely done.", { action: { label: "Undo", onClick: () => undo(task.id) } });
      }}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
        task.done ? "settle border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary hover:bg-secondary",
      )}
    >
      {task.done && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

export function TaskRow({ task, compact }: { task: Task; compact?: boolean }) {
  const { today, deleteTask, restoreTask, updateTask } = useStore();
  const { openTask, openBreakdown } = useUI();
  const [open, setOpen] = useState(false);
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <li className={cn("group border-b last:border-b-0", task.done && "opacity-60")}>
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <div className="pt-0.5"><TaskCheck task={task} /></div>
        <div className="min-w-0 flex-1">
          <button onClick={() => openTask(task)} className={cn("text-left text-[15px] leading-snug text-foreground hover:underline", task.done && "line-through decoration-muted-foreground")}>
            {task.title}
          </button>
          {!compact && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="chip"><PriorityDot p={task.priority} /> {task.category}</span>
              <span className="chip"><Clock className="size-3" /> {formatEffort(task.effort)}</span>
              {task.due && (
                <span className={cn("chip", !task.done && task.due <= today && "bg-terracotta-soft text-foreground")}>
                  <CalendarDays className="size-3" /> {formatDue(task.due, today)}
                </span>
              )}
              {task.subtasks.length > 0 && (
                <button onClick={() => setOpen((o) => !o)} className="chip hover:text-foreground" aria-expanded={open}>
                  {doneSubs}/{task.subtasks.length} steps <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
                </button>
              )}
            </div>
          )}
          {open && (
            <ul className="mt-2 grid gap-1.5 border-l-2 border-secondary pl-3">
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={s.done}
                    onChange={() => updateTask(task.id, { subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
                    aria-label={s.title}
                  />
                  <span className={cn(s.done && "text-muted-foreground line-through")}>{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!task.done && (
          <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex" onClick={() => openBreakdown(task)}>
            <Sprout /> Make it easier
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Task options" className="text-muted-foreground"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openTask(task)}><Pencil /> Edit</DropdownMenuItem>
            {!task.done && <DropdownMenuItem onClick={() => openBreakdown(task)}><Sprout /> Make it easier</DropdownMenuItem>}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                const t = deleteTask(task.id);
                if (t) toast("Task removed.", { action: { label: "Undo", onClick: () => restoreTask(t) } });
              }}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
