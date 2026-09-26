import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Fingerprint, Lock, MapPin, Handshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — LOSTLY AI" },
      { name: "description", content: "From photo to verified handover: how LOSTLY AI fingerprints items, scores matches and protects ownership." },
      { property: "og:title", content: "How LOSTLY AI works" },
      { property: "og:description", content: "Visual fingerprints, explainable matching, ownership verification and safe handovers." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: Camera, t: "Show it", d: "Upload a photo or use your camera. Add category, approximate place and time, and any distinguishing details." },
  { icon: Fingerprint, t: "AI item fingerprint", d: "AI reads color, shape, brand or logo, pattern, accessories, visible marks, text and distinctive features." },
  { icon: Sparkles, t: "Visual + contextual matching", d: "Each found report is scored on visual similarity, location proximity, time proximity, description similarity and distinctive features — never keywords alone." },
  { icon: MapPin, t: "Explainable results", d: "Every possible match shows why it was suggested. We say “possible match”, never certainty." },
  { icon: Lock, t: "Smart Ownership Verification", d: "Finders set a private question. Only a correct answer unlocks the connection." },
  { icon: Handshake, t: "Safe handover", d: "Meet at a public place or a verified Find Point, then mark the item returned." },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl font-semibold">How it works</h1>
      <p className="mt-2 text-muted-foreground">Lost it. Show it. Find it.</p>
      <ol className="relative mt-10 space-y-8 border-l border-border pl-8">
        {STEPS.map((s, i) => (
          <li key={s.t} className="relative animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="absolute -left-[49px] grid h-9 w-9 place-items-center rounded-full bg-brand shadow-glow"><s.icon className="h-4 w-4 text-primary-foreground" /></span>
            <h2 className="text-xl font-semibold">{i + 1}. {s.t}</h2>
            <p className="mt-1 text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex gap-3">
        <Button asChild className="bg-brand shadow-glow"><Link to="/demo">Try Live Demo</Link></Button>
        <Button asChild variant="outline"><Link to="/find">Find My Item →</Link></Button>
      </div>
    </div>
  );
}
