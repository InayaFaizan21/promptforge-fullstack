import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Fingerprint as FpIcon, Lock, SearchX, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemFields, PhotoUpload, emptyItem, validateItem, type ItemFormValue } from "@/components/lostly/ItemForm";
import { MatchCard, ScanFrame, ScanSteps, VerificationProgress, ItemThumb } from "@/components/lostly/Shared";
import { analyzeItem, createReport, findMatches, verifyOwnership, type Fingerprint, type MatchResult } from "@/lib/lostly.functions";
import { addPoints, saveMyItem, updateMyItem } from "@/lib/lostly";

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Find My Item — LOSTLY AI" },
      { name: "description", content: "Upload a photo of your lost item and let AI search nearby found reports with visual, location and time matching." },
      { property: "og:title", content: "Find your lost item with LOSTLY AI" },
      { property: "og:description", content: "AI item fingerprints, explainable matches and private ownership verification." },
    ],
  }),
  component: FindPage,
});

const STEPS = ["Creating item fingerprint…", "Searching community reports…", "Checking location + time…", "Ranking possible matches…"];

function FingerprintView({ fp, source }: { fp: Fingerprint; source: string }) {
  const rows: [string, string][] = [
    ["Color", fp.color ?? ""], ["Shape", fp.shape ?? ""], ["Brand / logo", fp.brand ?? ""], ["Pattern", fp.pattern ?? ""],
    ["Accessories", (fp.accessories ?? []).join(", ")], ["Visible marks", (fp.marks ?? []).join(", ")], ["Text", fp.text ?? ""],
    ["Distinctive features", (fp.features ?? []).join(", ")],
  ];
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold"><FpIcon className="h-4 w-4 text-primary" /> Item fingerprint <span className="ml-auto text-xs font-normal text-muted-foreground">{source === "ai" ? "Created by AI" : "Basic analysis"}</span></p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => (<div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>))}
      </dl>
    </div>
  );
}

type Stage = "form" | "searching" | "results" | "verify" | "verified";

function FindPage() {
  const analyze = useServerFn(analyzeItem);
  const create = useServerFn(createReport);
  const match = useServerFn(findMatches);
  const verify = useServerFn(verifyOwnership);

  const [v, setV] = useState<ItemFormValue>(emptyItem());
  const set = (p: Partial<ItemFormValue>) => setV((o) => ({ ...o, ...p }));
  const [stage, setStage] = useState<Stage>("form");
  const [step, setStep] = useState(0);
  const [fp, setFp] = useState<{ fingerprint: Fingerprint; source: string } | null>(null);
  const [results, setResults] = useState<{ searched: number; matches: MatchResult[] } | null>(null);
  const [claim, setClaim] = useState<MatchResult | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateItem(v);
    if (err) { toast.error(err); return; }
    setStage("searching"); setStep(0);
    try {
      const occurred = new Date(v.occurred_at).toISOString();
      const a = await analyze({ data: { image: v.photo, category: v.category, description: `${v.title}. ${v.description}` } });
      if (a.note) toast.message(a.note);
      setFp(a); setStep(1);
      const { id } = await create({ data: { kind: "lost", category: v.category, title: v.title, description: v.description, location_name: v.location_name, map_x: v.map_x!, map_y: v.map_y!, occurred_at: occurred, photo: v.photo, fingerprint: a.fingerprint } });
      setMyId(id); setStep(2);
      const r = await match({ data: { category: v.category, description: `${v.title} ${v.description}`, map_x: v.map_x!, map_y: v.map_y!, occurred_at: occurred, fingerprint: a.fingerprint } });
      setStep(3);
      await new Promise((res) => setTimeout(res, 600));
      saveMyItem({ id, kind: "lost", title: v.title, category: v.category, location: v.location_name, date: occurred, photo: v.photo, status: r.matches.length ? "match found" : "searching", matches: r.matches.length });
      setResults(r); setStage("results");
      if (r.matches[0]) toast("🔔 Possible match found", { description: `A found ${r.matches[0].title.toLowerCase()} was reported ${r.matches[0].distanceKm} km from where you lost yours.` });
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong. Please try again.");
      setStage("form");
    }
  }

  async function doVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!claim || !answer.trim()) return;
    setBusy(true);
    try {
      const r = await verify({ data: { reportId: claim.id, answer } });
      setVerifyMsg(r.message);
      if (r.verified) { setStage("verified"); updateMyItem(myId, { status: "connected" }); addPoints(5); toast.success("Ownership verified"); }
    } catch { setVerifyMsg("Verification is unavailable right now. Please try again."); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-lost">I lost something</p>
      <h1 className="mt-2 text-4xl font-semibold">Show it. We’ll search for it.</h1>

      {stage === "form" && (
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <PhotoUpload value={v.photo} onChange={(photo) => set({ photo })} />
            <p className="text-xs text-muted-foreground">A photo of the item (or a similar one) improves visual matching. Photos stay private to matching.</p>
            <Button type="submit" size="lg" className="w-full bg-brand shadow-glow"><Sparkles /> Find My Item</Button>
            <Link to="/demo" className="block text-center text-sm text-muted-foreground underline">Just exploring? Try the live demo</Link>
          </div>
          <ItemFields v={v} set={set} kind="lost" />
        </form>
      )}

      {stage === "searching" && (
        <div className="mt-8 grid gap-6 md:grid-cols-[300px_1fr]">
          <ScanFrame scanning>
            <ItemThumb photo={v.photo} category={v.category} className="aspect-square w-full" />
          </ScanFrame>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6"><ScanSteps steps={STEPS} active={step} /></div>
            {fp && <FingerprintView fp={fp.fingerprint} source={fp.source} />}
          </div>
        </div>
      )}

      {stage === "results" && results && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ItemThumb photo={v.photo} category={v.category} className="aspect-square w-full rounded-xl" />
            {fp && <FingerprintView fp={fp.fingerprint} source={fp.source} />}
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground">Searched {results.searched} community reports · <b className="text-foreground">{results.matches.length} potential {results.matches.length === 1 ? "match" : "matches"}</b></p>
            {results.matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No likely matches yet</h2>
                <p className="mt-2 text-muted-foreground">Your report is live. We’ll keep watching for new found items nearby.</p>
                <Button asChild className="mt-6" variant="outline"><Link to="/my-items">Go to My Items</Link></Button>
              </div>
            ) : (
              results.matches.map((m) => (
                <MatchCard key={m.id} m={m} onClaim={() => { setClaim(m); setStage("verify"); setAnswer(""); setVerifyMsg(""); updateMyItem(myId, { status: "verifying" }); }} onDismiss={() => setResults({ ...results, matches: results.matches.filter((x) => x.id !== m.id) })} />
              ))
            )}
          </div>
        </div>
      )}

      {(stage === "verify" || stage === "verified") && claim && (
        <div className="mx-auto mt-8 max-w-2xl space-y-6">
          <VerificationProgress step={stage === "verify" ? 1 : 2} />
          {stage === "verify" ? (
            <form onSubmit={doVerify} className="animate-fade-up rounded-2xl border border-border bg-card p-8">
              <button type="button" onClick={() => setStage("results")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to matches</button>
              <p className="flex items-center gap-2 text-sm font-semibold text-violet"><Lock className="h-4 w-4" /> Smart Ownership Verification</p>
              <h2 className="mt-3 text-2xl font-semibold">{claim.verify_question ?? "Describe something only the owner would know."}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Details about “{claim.title}” stay hidden until you answer correctly.</p>
              <div className="mt-6 flex gap-2">
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" aria-label="Verification answer" />
                <Button disabled={busy} className="bg-brand">{busy ? "Checking…" : "Verify"}</Button>
              </div>
              {verifyMsg && <p className="mt-3 text-sm text-destructive" role="alert">{verifyMsg}</p>}
            </form>
          ) : (
            <div className="animate-fade-up rounded-2xl border border-success/40 bg-card p-8">
              <p className="flex items-center gap-2 text-2xl font-semibold text-success"><ShieldCheck /> Match verified</p>
              <p className="mt-2 text-muted-foreground">{verifyMsg}</p>
              {claim.safe_storage && <p className="mt-4">Suggested safe handover: <b>{claim.safe_storage}</b> (verified Find Point)</p>}
              <Button asChild className="mt-6 bg-brand"><Link to="/my-items">Track in My Items</Link></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
