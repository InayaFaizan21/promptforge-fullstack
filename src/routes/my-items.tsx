import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Inbox, MapPin, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Celebration, ItemThumb } from "@/components/lostly/Shared";
import { STATUS_STYLES, getMyItems, getPoints, removeMyItem, timeAgo, updateMyItem, type MyItem } from "@/lib/lostly";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-items")({
  head: () => ({
    meta: [
      { title: "My Items — LOSTLY AI" },
      { name: "description", content: "Track your lost and found reports, possible matches, verification status and recovery history." },
      { property: "og:title", content: "My Items — LOSTLY AI dashboard" },
      { property: "og:description", content: "Your personal lost-and-found dashboard." },
    ],
  }),
  component: MyItems,
});

const BADGES = [
  { n: "🌟 Community Helper", at: 10 },
  { n: "🔎 Match Maker", at: 25 },
  { n: "🤝 Trusted Finder", at: 50 },
  { n: "🏆 Recovery Hero", at: 100 },
];

function ItemRow({ it, onChange }: { it: MyItem; onChange: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <ItemThumb photo={it.photo} category={it.category} className="h-16 w-16 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{it.title}</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{it.location} · {timeAgo(it.date)}</p>
        {it.matches ? <p className="text-xs text-warm">{it.matches} potential {it.matches === 1 ? "match" : "matches"}</p> : null}
      </div>
      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", STATUS_STYLES[it.status] ?? "bg-muted")}>{it.status}</span>
      <div className="flex gap-2">
        {it.kind === "lost" && it.status !== "returned" && (
          <Button size="sm" variant="outline" onClick={() => { updateMyItem(it.id, { status: "returned" }); onChange(); }}>Mark returned</Button>
        )}
        <Button size="icon" variant="ghost" aria-label="Delete from my list" onClick={() => { removeMyItem(it.id); onChange(); toast("Removed from your list"); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function Empty({ kind }: { kind: "lost" | "found" }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">No {kind} items yet.</p>
      <Button asChild className="mt-4 bg-brand"><Link to={kind === "lost" ? "/find" : "/report"}>{kind === "lost" ? "Find My Item" : "Report Found Item"}</Link></Button>
    </div>
  );
}

function MyItems() {
  const [items, setItems] = useState<MyItem[]>([]);
  const [points, setPoints] = useState(0);
  const [celebrate, setCelebrate] = useState<MyItem | null>(null);
  const refresh = () => {
    const next = getMyItems();
    const newlyReturned = next.find((n) => n.status === "returned" && items.find((o) => o.id === n.id && o.status !== "returned"));
    if (newlyReturned) setCelebrate(newlyReturned);
    setItems(next); setPoints(getPoints());
  };
  useEffect(() => { setItems(getMyItems()); setPoints(getPoints()); }, []);

  const lost = items.filter((i) => i.kind === "lost" && i.status !== "returned");
  const found = items.filter((i) => i.kind === "found");
  const matches = items.filter((i) => ["match found", "verifying", "connected"].includes(i.status));
  const history = items.filter((i) => i.status === "returned");
  const notifications = [
    ...matches.map((m) => ({ id: m.id, t: "🔔 Possible match found", d: `A report similar to your ${m.title.toLowerCase()} was posted nearby.` })),
    ...found.map((f) => ({ id: f.id + "f", t: "📍 Your found report is live", d: `Owners who lost a ${f.category.toLowerCase()} near ${f.location} will be notified.` })),
    ...items.filter((i) => i.status === "connected").map((c) => ({ id: c.id + "c", t: "✅ Ownership verification completed", d: `You can now arrange a safe handover for your ${c.title.toLowerCase()}.` })),
  ];
  const next = BADGES.find((b) => b.at > points);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-semibold">My Items</h1>
      <p className="mt-2 text-muted-foreground">Saved on this device. No account needed for the prototype.</p>

      {celebrate && (
        <div className="mt-6">
          <Celebration title="🎉 Item recovered" subtitle={`Your ${celebrate.title.toLowerCase()} found its way home. Matched by AI · Verified through LOSTLY AI.`} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="lost">
          <TabsList className="flex-wrap">
            <TabsTrigger value="lost">My Lost ({lost.length})</TabsTrigger>
            <TabsTrigger value="found">My Found ({found.length})</TabsTrigger>
            <TabsTrigger value="matches">Potential Matches ({matches.length})</TabsTrigger>
            <TabsTrigger value="history">Recovery History ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="lost" className="space-y-3">{lost.length ? lost.map((i) => <ItemRow key={i.id} it={i} onChange={refresh} />) : <Empty kind="lost" />}</TabsContent>
          <TabsContent value="found" className="space-y-3">{found.length ? found.map((i) => <ItemRow key={i.id} it={i} onChange={refresh} />) : <Empty kind="found" />}</TabsContent>
          <TabsContent value="matches" className="space-y-3">{matches.length ? matches.map((i) => <ItemRow key={i.id} it={i} onChange={refresh} />) : <p className="p-6 text-muted-foreground">No matches yet — we'll keep looking.</p>}</TabsContent>
          <TabsContent value="history" className="space-y-3">{history.length ? history.map((i) => <ItemRow key={i.id} it={i} onChange={refresh} />) : <p className="p-6 text-muted-foreground">Returned items will appear here.</p>}</TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-warm/40 bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-warm">Good Samaritan Score</p>
            <p className="mt-2 flex items-center gap-2 font-display text-4xl font-semibold"><Star className="h-7 w-7 text-warm" fill="currentColor" />{points}</p>
            {next && <p className="mt-1 text-xs text-muted-foreground">{next.at - points} points to {next.n}</p>}
            <ul className="mt-4 space-y-2 text-sm">
              {BADGES.map((b) => <li key={b.n} className={points >= b.at ? "" : "opacity-40"}>{b.n}</li>)}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">+10 report a found item · +5 verify a return. Symbolic, community-focused.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-primary" /> Notifications</p>
            <ul className="mt-3 space-y-3">
              {notifications.length === 0 && <li className="text-sm text-muted-foreground">You're all caught up.</li>}
              {notifications.map((n) => <li key={n.id} className="text-sm"><p className="font-medium">{n.t}</p><p className="text-muted-foreground">{n.d}</p></li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
