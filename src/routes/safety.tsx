import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, Lock, MapPin, Flag, Trash2, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & Privacy — LOSTLY AI" },
      { name: "description", content: "How LOSTLY AI protects contact details, hides sensitive item info before verification and encourages safe handovers." },
      { property: "og:title", content: "Safety & Privacy at LOSTLY AI" },
      { property: "og:description", content: "Privacy protected, verified matches and safe handovers." },
    ],
  }),
  component: Safety,
});

const RULES = [
  { icon: EyeOff, t: "No public contact details", d: "Phone numbers and emails are never shown on reports or the map." },
  { icon: Lock, t: "Details hidden until verified", d: "Sensitive item information stays private until ownership verification passes." },
  { icon: MapPin, t: "Safe, public handovers", d: "We suggest verified Find Points and public places for every handover." },
  { icon: Flag, t: "Report suspicious behavior", d: "Flag any claim or report that feels wrong — our team reviews it." },
  { icon: Trash2, t: "Delete your reports", d: "Remove items from your list at any time in My Items." },
  { icon: Database, t: "Clear data use", d: "Photos and descriptions are used only to create item fingerprints and find matches." },
];

function Safety() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold">Safety & Privacy</h1>
      <p className="mt-2 text-muted-foreground">Trust is the product. Here's how we protect finders and owners.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {RULES.map((r) => (
          <div key={r.t} className="rounded-2xl border border-border bg-card p-6">
            <r.icon className="h-6 w-6 text-success" />
            <h2 className="mt-3 font-semibold">{r.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warm/40 bg-card p-6">
        <p className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warm" /> LOSTLY AI assists with matching. It does not guarantee ownership or recovery.</p>
        <Button variant="outline" onClick={() => toast.success("Thanks — our team will review your report.")}><Flag /> Report suspicious activity</Button>
      </div>
    </div>
  );
}
