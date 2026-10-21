export function LeafMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M9 23c0-8 5.5-13 14-14-0.5 8.5-5.5 14-14 14Z" className="fill-sage" />
      <path d="M9.5 22.5 18 14" className="stroke-primary" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LeafMark />
      <span className="font-serif text-xl font-medium tracking-tight text-foreground">Slothful</span>
    </span>
  );
}
