import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Check, MapPin, MessageSquare, Search, ShieldCheck, Sparkles, Star, Users, X, TrendingDown, TrendingUp, Building2, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanFrame, useCountUp } from "@/components/lostly/Shared";
import lostImg from "@/assets/backpack-lost.jpg";
import foundImg from "@/assets/backpack-found.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LOSTLY AI — Lost it. Show it. Find it." },
      { name: "description", content: "Upload a photo of what you lost. LOSTLY AI matches it against nearby found reports using visual similarity, location and time." },
      { property: "og:title", content: "LOSTLY AI — AI that brings lost things home" },
      { property: "og:description", content: "A hyper-local AI lost-and-found network with visual matching, verified find points and safe ownership checks." },
    ],
  }),
  component: Home,
});

const PHASES = ["Comparing visual features…", "Checking nearby reports…", "Analyzing location + time…"];

function HeroVisual() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 5), 1400);
    return () => clearInterval(t);
  }, []);
  const done = phase >= 3;
  const pct = useCountUp(done ? 94 : 0, 900);
  return (
    <div className="relative rounded-3xl border border-border bg-card/70 p-4 shadow-soft sm:p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-lost">Lost report</p>
          <ScanFrame scanning={!done}>
            <img src={lostImg} alt="Photo of a lost black backpack with a blue keychain" width={816} height={816} className="aspect-square w-full object-cover" />
          </ScanFrame>
        </div>
        <div className="flex w-24 flex-col items-center gap-2 text-center sm:w-36">
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-brand shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
            {!done && <span className="absolute inset-0 rounded-full bg-primary animate-ping-soft" />}
          </div>
          <p className="min-h-10 text-[11px] text-muted-foreground sm:text-xs" aria-live="polite">{done ? "Potential Match Found" : PHASES[phase]}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-success">Found report</p>
          <div className={`relative overflow-hidden rounded-xl border transition-all duration-700 ${done ? "border-success/60 opacity-100" : "border-border opacity-30 blur-[2px]"}`}>
            <img src={foundImg} alt="Found black backpack at a café" width={816} height={816} className="aspect-square w-full object-cover" />
            {done && (
              <div className="absolute inset-x-2 bottom-2 animate-pop rounded-lg bg-background/90 p-2 text-center">
                <p className="font-display text-xl font-semibold text-gradient sm:text-2xl">{pct}% Match</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
        {["Lost", "AI Match", "Verified", "Found"].map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={`rounded-full px-2 py-1 transition-colors duration-500 ${phase >= i + 1 || (i === 0) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{s}</span>
            {i < 3 && <span className="h-px flex-1 overflow-hidden bg-border"><span className="block h-full bg-brand transition-all duration-700" style={{ width: phase > i ? "100%" : "0%" }} /></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> AI-powered hyper-local recovery network
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Lost something?<br /><span className="text-gradient">Let AI find the match.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Upload a photo, describe what you lost, and LOSTLY AI searches community reports to discover potential matches using visual similarity, location and time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand shadow-glow hover:opacity-90"><Link to="/find">Find My Item <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/report">Report Found Item</Link></Button>
              <Button asChild size="lg" variant="ghost" className="text-warm hover:text-warm"><Link to="/demo"><Sparkles /> Try Live Demo</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Privacy protected</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Ownership verified</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-success" /> Safe handover</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/find" className="group rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-lost/50">
            <Search className="h-8 w-8 text-lost" />
            <h2 className="mt-4 text-2xl font-semibold">I Lost Something</h2>
            <p className="mt-2 text-muted-foreground">Upload a photo, mark where you lost it and let AI search community reports for you.</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm text-primary">Start search <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link to="/report" className="group rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-success/50">
            <Heart className="h-8 w-8 text-success" />
            <h2 className="mt-4 text-2xl font-semibold">I Found Something</h2>
            <p className="mt-2 text-muted-foreground">Snap a photo and add a private question only the real owner can answer.</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm text-primary">Report found item <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-lost">The problem</p>
              <h2 className="mt-3 text-3xl font-semibold">Reports are scattered everywhere.</h2>
              <p className="mt-4 text-muted-foreground">Lost belongings often become impossible to recover because reports are scattered across WhatsApp groups, social media posts, security desks and local communities.</p>
              <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-success">The solution</p>
              <h2 className="mt-3 text-3xl font-semibold">One intelligent, local network.</h2>
              <p className="mt-4 text-muted-foreground">LOSTLY AI connects these fragmented reports through AI-powered matching and a hyper-local recovery network.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-muted-foreground">Old way</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {["Search WhatsApp", "Ask security", "Post on social media", "Hope someone responds"].map((s) => (
                    <li key={s} className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4 text-lost" />{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-glow">
                <p className="text-sm font-semibold text-gradient">LOSTLY AI</p>
                <ol className="mt-4 space-y-3 text-sm">
                  {["Upload", "AI matches", "Verify ownership", "Connect safely", "Recover"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-[10px] text-primary">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold">More than keywords.</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Every match is explained, every claim is verified, and everyday places become part of the recovery network.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Camera, t: "Visual + context matching", d: "Compares color, shape, logos, accessories, location and time — then tells you why." },
            { icon: ShieldCheck, t: "Smart Ownership Verification", d: "Finders set a private question. Details stay hidden until the owner proves it's theirs." },
            { icon: Star, t: "LOSTLY Find Points", d: "Cafés, libraries, campuses and malls become verified safe-storage points." },
            { icon: MessageSquare, t: "Smart notifications", d: "\"A found black backpack was reported 1.2 km from where you lost yours.\"" },
            { icon: Users, t: "Good Samaritan Score", d: "Symbolic points and badges for people who report, identify and return items." },
            { icon: MapPin, t: "Lost & Found Around You", d: "A live neighborhood map of lost reports, found reports and find points." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Potential impact · prototype goals</p>
          <h2 className="mt-3 text-3xl font-semibold">Turning lost moments into found moments.</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
            {[
              { d: "down", t: "Search time" }, { d: "down", t: "Fragmented reports" }, { d: "down", t: "False claims" },
              { d: "up", t: "Recovery opportunities" }, { d: "up", t: "Community participation" }, { d: "up", t: "Trust" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-border bg-card p-5">
                {x.d === "down" ? <TrendingDown className="h-6 w-6 text-success" /> : <TrendingUp className="h-6 w-6 text-primary" />}
                <p className="mt-3 text-sm font-medium">{x.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold">Free for people. Built to scale with places.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Heart, n: "Free", items: ["Basic lost/found reports", "AI matching", "Community access"] },
            { icon: Crown, n: "Premium", items: ["Advanced search", "Priority notifications", "Extended history", "Detailed matching reports"] },
            { icon: Building2, n: "Business", items: ["Verified Find Point", "Staff dashboard", "Multiple item management", "Organization analytics"] },
          ].map((p, i) => (
            <div key={p.n} className={`rounded-2xl border bg-card p-6 ${i === 2 ? "border-primary/40 shadow-glow" : "border-border"}`}>
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-xl font-semibold">{p.n}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{p.items.map((it) => <li key={it} className="flex gap-2"><Check className="h-4 w-4 text-success" />{it}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Starts in one neighborhood, grows city by city — every new Find Point extends the network.</p>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold sm:text-5xl">Maybe it’s not lost forever.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Sometimes, it just needs the right match.</p>
          <Button asChild size="lg" className="mt-8 bg-brand shadow-glow hover:opacity-90"><Link to="/find">Start Finding <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
