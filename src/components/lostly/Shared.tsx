import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryIcon } from "@/lib/lostly";
import type { MatchResult } from "@/lib/lostly.functions";

export function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function ScanSteps({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ul className="space-y-3">
      {steps.map((s, i) => (
        <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > active && "opacity-30")}>
          {i < active ? <Check className="h-4 w-4 text-success" /> : i === active ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full border border-border" />}
          {s}
        </li>
      ))}
    </ul>
  );
}

export function ScanFrame({ children, scanning }: { children: React.ReactNode; scanning: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      {children}
      {scanning && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 animate-scan bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        </>
      )}
    </div>
  );
}

export function ItemThumb({ photo, category, className }: { photo?: string | null; category: string; className?: string }) {
  const Icon = categoryIcon(category);
  if (photo) return <img src={photo} alt={`${category} item`} className={cn("object-cover", className)} />;
  return (
    <div className={cn("grid place-items-center bg-gradient-to-br from-secondary to-accent", className)}>
      <Icon className="h-1/3 w-1/3 text-primary" />
    </div>
  );
}

export const VERIFY_STEPS = ["Match Found", "Ownership Check", "Both Users Connected", "Item Returned"];

export function VerificationProgress({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Verification progress">
      {VERIFY_STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className={cn("grid h-7 w-7 place-items-center rounded-full border text-xs transition-all duration-500", i < step ? "border-success bg-success text-background" : i === step ? "border-primary text-primary shadow-glow" : "border-border text-muted-foreground")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">{s}</span>
          </div>
          {i < VERIFY_STEPS.length - 1 && <span className={cn("h-px flex-1 transition-colors duration-700", i < step ? "bg-success" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{value}%</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all duration-1000" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function MatchCard({ m, onClaim, onDismiss }: { m: MatchResult; onClaim?: () => void; onDismiss?: () => void }) {
  const pct = useCountUp(m.overall);
  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex gap-4 p-5">
        <ItemThumb photo={m.photo} category={m.category} className="h-24 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm">Possible match</p>
          <h3 className="mt-1 truncate text-lg font-semibold">{m.title}</h3>
          <p className="text-sm text-muted-foreground">{m.location_name}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-semibold text-gradient">{pct}%</p>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>
      <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
        <div className="space-y-3">
          <Bar label="Visual similarity" value={m.visual} />
          <Bar label="Description similarity" value={m.description} />
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-1">Location: {m.location}</span>
            <span className="rounded-full bg-muted px-2 py-1">Time: {m.time}</span>
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Why does LOSTLY AI think this may be yours?</p>
          <ul className="space-y-1 text-sm">
            {m.reasons.length ? m.reasons.map((r) => <li key={r} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{r}</li>) : <li className="text-muted-foreground">Likely similar based on category and description.</li>}
          </ul>
        </div>
      </div>
      {(onClaim || onDismiss) && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" /> Private details hidden until verified</span>
          <div className="flex gap-2">
            {onDismiss && <button onClick={onDismiss} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Not mine</button>}
            {onClaim && <button onClick={onClaim} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90">This may be mine</button>}
          </div>
        </div>
      )}
    </article>
  );
}

export function Celebration({ title, subtitle }: { title: string; subtitle: string }) {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  const colors = ["bg-primary", "bg-violet", "bg-warm", "bg-success"];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-success/40 bg-card p-8 text-center">
      {pieces.map((i) => (
        <span key={i} className={cn("absolute top-0 h-2 w-1.5 rounded-sm animate-confetti", colors[i % 4])} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }} />
      ))}
      <div className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-success/20"><Check className="h-8 w-8 text-success" /></div>
      <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
