import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, RotateCcw, ShieldCheck, Target, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Celebration, MatchCard, ScanFrame, ScanSteps, VerificationProgress } from "@/components/lostly/Shared";
import type { MatchResult } from "@/lib/lostly.functions";
import lostImg from "@/assets/backpack-lost.jpg";
import foundImg from "@/assets/backpack-found.jpg";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live Demo — LOSTLY AI" },
      { name: "description", content: "One-click demo: watch LOSTLY AI match a lost backpack, verify ownership and connect finder and owner safely." },
      { property: "og:title", content: "Try the LOSTLY AI live demo" },
      { property: "og:description", content: "No account needed — see AI matching and ownership verification end-to-end." },
    ],
  }),
  component: Demo,
});

const STEPS = ["Analyzing image…", "Extracting visual features…", "Comparing community reports…", "Checking nearby matches…"];

const MATCH: MatchResult = {
  id: "demo", title: "Black backpack with blue keychain", category: "Bags", location_name: "Harbor Street Café · 1.2 km away",
  occurred_at: new Date(0).toISOString(), safe_storage: "Harbor Street Café", verify_question: "What is attached to the zipper?",
  photo: foundImg, overall: 94, visual: 96, description: 91, location: "High", time: "High", distanceKm: 1.2,
  reasons: ["Same backpack color", "Similar shape", "Same visible logo patch", "Matching blue keychain", "Reported in nearby area"],
};

type Stage = "idle" | "scanning" | "match" | "verify" | "verified" | "returned";

function Demo() {
  const [stage, setStage] = useState<Stage>("idle");
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (stage !== "scanning") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => {
      if (s >= STEPS.length - 1) { clearInterval(t); setTimeout(() => setStage("match"), 700); return STEPS.length; }
      return s + 1;
    }), 1000);
    return () => clearInterval(t);
  }, [stage]);

  const progress = stage === "match" ? 0 : stage === "verify" ? 1 : stage === "verified" ? 2 : stage === "returned" ? 4 : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-warm">Competition demo mode</p>
          <h1 className="mt-2 text-4xl font-semibold">Watch a lost backpack find its way home.</h1>
          <p className="mt-2 text-muted-foreground">Sample scenario with demo data — no account or live AI required.</p>
        </div>
        {stage !== "idle" && <Button variant="outline" onClick={() => { setStage("idle"); setAnswer(""); setError(""); }}><RotateCcw /> Restart</Button>}
      </div>

      {stage !== "idle" && stage !== "scanning" && <div className="mt-8"><VerificationProgress step={progress} /></div>}

      <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
        <div>
          <ScanFrame scanning={stage === "scanning"}>
            <img src={lostImg} alt="Sample photo of a lost black backpack" width={816} height={816} className="aspect-square w-full object-cover" />
          </ScanFrame>
          <p className="mt-2 text-xs text-muted-foreground">Lost near Elm Park · yesterday, 6 pm</p>
        </div>

        <div className="min-h-[320px]">
          {stage === "idle" && (
            <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-dashed border-border p-8">
              <h2 className="text-2xl font-semibold">A unique black backpack was lost.</h2>
              <p className="mt-2 text-muted-foreground">Upload the photo and let LOSTLY AI search nearby community reports.</p>
              <Button size="lg" className="mt-6 bg-brand shadow-glow" onClick={() => setStage("scanning")}><Play /> Try Live Demo</Button>
            </div>
          )}
          {stage === "scanning" && (
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="mb-6 text-sm text-muted-foreground">Searching 1,284 community reports (sample)…</p>
              <ScanSteps steps={STEPS} active={step} />
            </div>
          )}
          {stage === "match" && (
            <div className="space-y-4">
              <p className="flex items-center gap-2 font-display text-xl font-semibold"><Target className="text-warm" /> Potential match found</p>
              <MatchCard m={MATCH} onClaim={() => setStage("verify")} />
            </div>
          )}
          {stage === "verify" && (
            <form
              className="animate-fade-up rounded-2xl border border-border bg-card p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (/blue|keychain|key chain|bear|charm/i.test(answer)) { setError(""); setStage("verified"); }
                else setError("That doesn't match the finder's details. Hint for the demo: think about the zipper.");
              }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-violet"><Lock className="h-4 w-4" /> Ownership verification required</p>
              <h2 className="mt-3 text-2xl font-semibold">What is attached to the zipper?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Only the real owner should know. The finder's photo and contact stay private until verified.</p>
              <div className="mt-6 flex gap-2">
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" aria-label="Verification answer" autoFocus />
                <Button type="submit" className="bg-brand">Verify</Button>
              </div>
              {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
              <button type="button" onClick={() => setAnswer("A blue keychain")} className="mt-3 text-xs text-muted-foreground underline">Fill demo answer</button>
            </form>
          )}
          {stage === "verified" && (
            <div className="animate-fade-up space-y-4 rounded-2xl border border-success/40 bg-card p-8">
              <p className="flex items-center gap-2 text-2xl font-semibold text-success"><ShieldCheck /> Match verified</p>
              <p className="text-muted-foreground">Finder and owner can now connect safely. Suggested handover: <b className="text-foreground">Harbor Street Café</b> — a verified Find Point, open 7am – 8pm.</p>
              <Button className="bg-brand" onClick={() => setStage("returned")}>Mark as returned</Button>
            </div>
          )}
          {stage === "returned" && (
            <div className="space-y-4">
              <Celebration title="🎉 Item recovered" subtitle="Your backpack found its way home." />
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                {["Recovered in 2 days", "Matched by AI", "Verified through LOSTLY AI"].map((s) => <div key={s} className="rounded-xl border border-border bg-card p-3">{s}</div>)}
              </div>
              <Button asChild variant="outline"><Link to="/find">Try it with your own item →</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
