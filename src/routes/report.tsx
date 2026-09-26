import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemFields, PhotoUpload, emptyItem, validateItem, type ItemFormValue } from "@/components/lostly/ItemForm";
import { Celebration, ScanSteps } from "@/components/lostly/Shared";
import { analyzeItem, createReport } from "@/lib/lostly.functions";
import { addPoints, saveMyItem } from "@/lib/lostly";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Found Item — LOSTLY AI" },
      { name: "description", content: "Found something? Report it in a minute with a private ownership question so only the real owner can claim it." },
      { property: "og:title", content: "Report a found item on LOSTLY AI" },
      { property: "og:description", content: "Help someone get their belongings back — safely and privately." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const analyze = useServerFn(analyzeItem);
  const create = useServerFn(createReport);
  const [v, setV] = useState<ItemFormValue>(emptyItem());
  const set = (p: Partial<ItemFormValue>) => setV((o) => ({ ...o, ...p }));
  const [storage, setStorage] = useState("");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [stage, setStage] = useState<"form" | "saving" | "done">("form");
  const [step, setStep] = useState(0);
  const [points, setPoints] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateItem(v) || (!q.trim() || !a.trim() ? "Add a private verification question and answer." : "");
    if (err) { toast.error(err); return; }
    setStage("saving"); setStep(0);
    try {
      const occurred = new Date(v.occurred_at).toISOString();
      const r = await analyze({ data: { image: v.photo, category: v.category, description: `${v.title}. ${v.description}` } });
      setStep(1);
      const { id } = await create({ data: { kind: "found", category: v.category, title: v.title, description: v.description, location_name: v.location_name, map_x: v.map_x!, map_y: v.map_y!, occurred_at: occurred, photo: v.photo, fingerprint: r.fingerprint, safe_storage: storage || undefined, verify_question: q, verify_answer: a } });
      setStep(2);
      saveMyItem({ id, kind: "found", title: v.title, category: v.category, location: v.location_name, date: occurred, photo: v.photo, status: "searching" });
      setPoints(addPoints(10));
      setStage("done");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save the report.");
      setStage("form");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-success">I found something</p>
      <h1 className="mt-2 text-4xl font-semibold">Thank you for helping.</h1>
      <p className="mt-2 text-muted-foreground">Shops, schools, security desks and neighbors can all report. Private details are never shown publicly.</p>

      {stage === "form" && (
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <PhotoUpload value={v.photo} onChange={(photo) => set({ photo })} />
            <div className="rounded-2xl border border-violet/40 bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-violet"><Lock className="h-4 w-4" /> Private ownership check</p>
              <p className="mt-1 text-xs text-muted-foreground">Ask something only the owner would know. The answer is never shown to anyone.</p>
              <Label htmlFor="q" className="mt-4 block">Question</Label>
              <Input id="q" className="mt-2" maxLength={200} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What color is the keychain?" />
              <Label htmlFor="a" className="mt-3 block">Answer</Label>
              <Input id="a" className="mt-2" maxLength={200} value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. blue" />
            </div>
            <div>
              <Label htmlFor="st">Safe-storage location (optional)</Label>
              <Input id="st" className="mt-2" maxLength={160} value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="e.g. Central Library front desk" />
            </div>
            <Button type="submit" size="lg" className="w-full bg-brand shadow-glow">Report Found Item</Button>
          </div>
          <ItemFields v={v} set={set} kind="found" />
        </form>
      )}

      {stage === "saving" && (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-8">
          <ScanSteps steps={["Creating item fingerprint…", "Saving your report privately…", "Notifying nearby owners…"]} active={step} />
        </div>
      )}

      {stage === "done" && (
        <div className="mx-auto mt-10 max-w-xl space-y-4">
          <Celebration title="Report posted" subtitle="We'll notify people who lost something similar nearby." />
          <p className="flex items-center justify-center gap-2 text-center text-warm"><Star className="h-4 w-4" fill="currentColor" /> +10 Good Samaritan points · total {points}</p>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline"><Link to="/map">See it on the map</Link></Button>
            <Button className="bg-brand" onClick={() => { setV(emptyItem()); setQ(""); setA(""); setStorage(""); setStage("form"); }}>Report another</Button>
          </div>
        </div>
      )}
    </div>
  );
}
