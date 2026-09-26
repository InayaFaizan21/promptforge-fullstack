import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Star, MapPin, Clock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CityMap, type MapPin as Pin } from "@/components/lostly/CityMap";
import { ItemThumb } from "@/components/lostly/Shared";
import { CATEGORIES, timeAgo, type FindPoint, type ReportRow } from "@/lib/lostly";
import { cn } from "@/lib/utils";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: async () => {
    const [r, p] = await Promise.all([
      supabase.from("reports").select("id,kind,category,title,description,location_name,map_x,map_y,occurred_at,photo,safe_storage,status,is_demo,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("find_points").select("*"),
    ]);
    if (r.error || p.error) throw new Error("Couldn't load the map.");
    return { reports: r.data as ReportRow[], points: p.data as FindPoint[] };
  },
});

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Lost & Found Around You — LOSTLY AI Map" },
      { name: "description", content: "Explore lost reports, found reports and verified Find Points in your neighborhood." },
      { property: "og:title", content: "Lost & Found Around You" },
      { property: "og:description", content: "A hyper-local map of lost items, found items and verified Find Points." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(mapQuery),
  errorComponent: () => <p className="p-12 text-center text-muted-foreground">The map couldn't load. Please refresh.</p>,
  component: MapPage,
});

function MapPage() {
  const { data } = useSuspenseQuery(mapQuery);
  const [cat, setCat] = useState<string | null>(null);
  const [kind, setKind] = useState<"all" | "lost" | "found" | "points">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const reports = useMemo(() => data.reports.filter((r) => (!cat || r.category === cat) && (kind === "all" || kind === r.kind) && (!q || `${r.title} ${r.location_name}`.toLowerCase().includes(q.toLowerCase()))), [data, cat, kind, q]);
  const showPoints = kind === "all" || kind === "points";
  const pins: Pin[] = [
    ...(kind === "points" ? [] : reports.map((r) => ({ id: r.id, x: Number(r.map_x), y: Number(r.map_y), type: r.kind, label: r.title }))),
    ...(showPoints ? data.points.map((p) => ({ id: p.id, x: Number(p.map_x), y: Number(p.map_y), type: "point" as const, label: p.name })) : []),
  ];
  const selReport = data.reports.find((r) => r.id === sel);
  const selPoint = data.points.find((p) => p.id === sel);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-4xl font-semibold">Lost & Found Around You</h1>
      <p className="mt-2 text-muted-foreground">Instead of one giant lost-and-found office, LOSTLY AI turns everyday places into a decentralized recovery network.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search nearby…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search nearby" />
        </div>
        {(["all", "lost", "found", "points"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm capitalize", kind === k ? "border-primary bg-primary/15" : "border-border text-muted-foreground")}>
            {k === "lost" && <span className="h-2 w-2 rounded-full bg-lost" />}{k === "found" && <span className="h-2 w-2 rounded-full bg-success" />}{k === "points" && <Star className="h-3 w-3 text-warm" />}
            {k === "points" ? "Find Points" : k}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setCat(null)} className={cn("rounded-full px-3 py-1 text-xs", !cat ? "bg-secondary" : "text-muted-foreground")}>All categories</button>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCat(c.value)} className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs", cat === c.value ? "bg-secondary" : "text-muted-foreground hover:text-foreground")}><c.icon className="h-3 w-3" />{c.value}</button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <CityMap pins={pins} selected={sel} onSelect={setSel} />
        <aside className="space-y-3">
          {selReport && (
            <div className="animate-fade-up rounded-2xl border border-border bg-card p-4">
              <ItemThumb photo={selReport.photo} category={selReport.category} className="aspect-video w-full rounded-lg" />
              <p className={cn("mt-3 text-xs font-semibold uppercase", selReport.kind === "lost" ? "text-lost" : "text-success")}>{selReport.kind} report{selReport.is_demo && " · sample"}</p>
              <h2 className="font-semibold">{selReport.title}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{selReport.location_name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{timeAgo(selReport.occurred_at)}</p>
              <Button asChild size="sm" className="mt-3 w-full bg-brand"><Link to={selReport.kind === "found" ? "/find" : "/report"}>{selReport.kind === "found" ? "Is this yours? Start a search" : "Found this? Report it"}</Link></Button>
            </div>
          )}
          {selPoint && (
            <div className="animate-fade-up rounded-2xl border border-warm/40 bg-card p-4">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase text-warm"><ShieldCheck className="h-3.5 w-3.5" /> Verified Find Point</p>
              <h2 className="mt-1 font-semibold">📍 {selPoint.name}</h2>
              <p className="text-sm text-muted-foreground">{selPoint.kind} · {selPoint.hours}</p>
              <p className="mt-2 text-sm">{selPoint.items_in_storage} {selPoint.items_in_storage === 1 ? "item" : "items"} currently in safe storage</p>
            </div>
          )}
          {!sel && <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Tap a marker to see details.</p>}
          <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
            {reports.length === 0 && <p className="text-sm text-muted-foreground">No reports match these filters.</p>}
            {reports.map((r) => (
              <button key={r.id} onClick={() => setSel(r.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors hover:border-primary/50", sel === r.id ? "border-primary" : "border-border")}>
                <ItemThumb photo={r.photo} category={r.category} className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground"><span className={r.kind === "lost" ? "text-lost" : "text-success"}>{r.kind}</span> · {r.location_name}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
