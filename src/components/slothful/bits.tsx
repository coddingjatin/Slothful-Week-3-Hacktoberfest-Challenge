import { Cpu, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import type { AISource } from "@/lib/ai/provider";
import { cn } from "@/lib/utils";
import type { Energy, Priority } from "@/lib/types";

export function SourceBadge({ source }: { source: AISource }) {
  return source.kind === "model" ? (
    <span className="chip bg-secondary text-secondary-foreground">
      <Cpu className="size-3" /> Suggested by {source.model} (local model)
    </span>
  ) : (
    <span className="chip bg-terracotta-soft text-foreground">
      <FlaskConical className="size-3" /> Demo mode · rule-based, not AI
    </span>
  );
}

export function PriorityDot({ p }: { p: Priority }) {
  return (
    <span
      title={`${p} priority`}
      className={cn("inline-block size-2 rounded-full", p === "high" ? "bg-terracotta" : p === "medium" ? "bg-primary" : "bg-border")}
    />
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-serif text-3xl font-normal text-foreground md:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export const ENERGY_LABEL: Record<Energy, string> = { low: "Low energy", medium: "Medium energy", high: "High energy" };

export function EnergyBars({ e }: { e: Energy }) {
  const n = e === "low" ? 1 : e === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("w-1 rounded-sm", i <= n ? "bg-primary" : "bg-border")} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[5px] px-3 py-1.5 text-sm transition-colors",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
