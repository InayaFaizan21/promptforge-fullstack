import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapPin = { id: string; x: number; y: number; type: "lost" | "found" | "point"; label: string };

export function CityMap({
  pins,
  selected,
  onSelect,
  onPick,
  picked,
  className,
}: {
  pins: MapPin[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  onPick?: (x: number, y: number) => void;
  picked?: { x: number; y: number } | null;
  className?: string;
}) {
  return (
    <div
      className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-surface", onPick && "cursor-crosshair", className)}
      onClick={(e) => {
        if (!onPick) return;
        const r = e.currentTarget.getBoundingClientRect();
        onPick(Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100));
      }}
    >
      <svg viewBox="0 0 100 62.5" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100" height="62.5" className="fill-surface" />
        <path d="M0 44 C 20 40, 30 52, 50 48 S 80 36, 100 42 L100 50 C 80 44, 65 56, 50 55 S 20 48, 0 52 Z" className="fill-primary/15" />
        <rect x="40" y="38" width="12" height="9" rx="1.5" className="fill-success/10" />
        <rect x="12" y="6" width="16" height="10" rx="1.5" className="fill-violet/10" />
        {[10, 22, 34, 48, 62, 76, 90].map((x) => <line key={x} x1={x} y1="0" x2={x + 4} y2="62.5" className="stroke-border" strokeWidth="0.35" />)}
        {[8, 20, 32, 58].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y - 2} className="stroke-border" strokeWidth="0.35" />)}
        <line x1="0" y1="26" x2="100" y2="22" className="stroke-muted-foreground/40" strokeWidth="0.9" />
        <line x1="55" y1="0" x2="60" y2="62.5" className="stroke-muted-foreground/40" strokeWidth="0.9" />
      </svg>
      {pins.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect?.(p.id); }}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          aria-label={p.label}
        >
          {p.type === "point" ? (
            <span className={cn("grid h-7 w-7 place-items-center rounded-full bg-warm text-warm-foreground shadow-soft transition-transform group-hover:scale-125", selected === p.id && "scale-125 ring-2 ring-foreground")}>
              <Star className="h-4 w-4" fill="currentColor" />
            </span>
          ) : (
            <span className="relative block">
              <span className={cn("absolute inset-0 rounded-full animate-ping-soft", p.type === "lost" ? "bg-lost" : "bg-success")} />
              <span className={cn("relative block h-4 w-4 rounded-full border-2 border-background transition-transform group-hover:scale-150", p.type === "lost" ? "bg-lost" : "bg-success", selected === p.id && "scale-150 ring-2 ring-foreground")} />
            </span>
          )}
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs shadow-soft group-hover:block">{p.label}</span>
        </button>
      ))}
      {picked && (
        <span className="absolute -translate-x-1/2 -translate-y-full animate-pop" style={{ left: `${picked.x}%`, top: `${picked.y}%` }}>
          <span className="block h-5 w-5 rounded-full rounded-br-none rotate-45 bg-primary shadow-glow" />
        </span>
      )}
      <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Demo neighborhood · sample data</span>
    </div>
  );
}
