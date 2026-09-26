import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORIES, compressImage } from "@/lib/lostly";
import { CityMap } from "./CityMap";

export type ItemFormValue = {
  photo?: string;
  category: string;
  title: string;
  description: string;
  location_name: string;
  map_x: number | null;
  map_y: number | null;
  occurred_at: string;
};

export function emptyItem(): ItemFormValue {
  const d = new Date(Date.now() - 2 * 36e5);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  return { category: "", title: "", description: "", location_name: "", map_x: null, map_y: null, occurred_at: local };
}

export function PhotoUpload({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose an image file.");
    setBusy(true); setErr("");
    try { onChange(await compressImage(f)); } catch { setErr("Couldn't read that image. Try a JPG or PNG."); }
    setBusy(false);
  }
  return (
    <div>
      {value ? (
        <div className="relative animate-pop overflow-hidden rounded-xl border border-border">
          <img src={value} alt="Uploaded item" className="aspect-[4/3] w-full object-cover" />
          <button type="button" onClick={() => onChange(undefined)} aria-label="Remove photo" className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
          className={cn("flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface text-center transition-colors hover:border-primary/60", busy && "animate-pulse")}
        >
          <ImagePlus className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">{busy ? "Processing photo…" : "Drag a photo here, or"}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.click()} className="rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-accent">Upload photo</button>
            <button type="button" onClick={() => camRef.current?.click()} className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-accent"><Camera className="h-4 w-4" /> Camera</button>
          </div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files?.[0])} />
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
    </div>
  );
}

export function ItemFields({ v, set, kind }: { v: ItemFormValue; set: (p: Partial<ItemFormValue>) => void; kind: "lost" | "found" }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Category</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.value} onClick={() => set({ category: c.value })} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all", v.category === c.value ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>
              <c.icon className="h-4 w-4" />{c.value}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Short title</Label>
          <Input id="title" className="mt-2" maxLength={120} value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder={kind === "lost" ? "e.g. Black backpack" : "e.g. Blue umbrella"} />
        </div>
        <div>
          <Label htmlFor="when">{kind === "lost" ? "Approx. when lost" : "When found"}</Label>
          <Input id="when" type="datetime-local" className="mt-2" value={v.occurred_at} onChange={(e) => set({ occurred_at: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor="desc">{kind === "lost" ? "Distinguishing details" : "Short description"}</Label>
        <Textarea id="desc" className="mt-2" maxLength={1000} rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} placeholder={kind === "lost" ? "Color, brand, stickers, keychains, marks…" : "What it looks like. Don't include private details like names or card numbers."} />
      </div>
      <div>
        <Label htmlFor="loc">Location {kind === "lost" ? "(approximate)" : "found"}</Label>
        <Input id="loc" className="mt-2" maxLength={160} value={v.location_name} onChange={(e) => set({ location_name: e.target.value })} placeholder="e.g. Near Central Library" />
        <p className="mt-2 text-xs text-muted-foreground">Tap the map to drop a pin.</p>
        <CityMap className="mt-2" pins={[]} picked={v.map_x != null ? { x: v.map_x, y: v.map_y! } : null} onPick={(x, y) => set({ map_x: x, map_y: y })} />
      </div>
    </div>
  );
}

export function validateItem(v: ItemFormValue) {
  if (!v.category) return "Choose a category.";
  if (v.title.trim().length < 2) return "Add a short title.";
  if (v.location_name.trim().length < 2) return "Add a location.";
  if (v.map_x == null) return "Drop a pin on the map.";
  return "";
}
