import { Backpack, Smartphone, Wallet, FileText, KeyRound, Laptop, Package, type LucideIcon } from "lucide-react";

export const CATEGORIES: { value: string; icon: LucideIcon }[] = [
  { value: "Phones", icon: Smartphone },
  { value: "Wallets", icon: Wallet },
  { value: "Bags", icon: Backpack },
  { value: "Documents", icon: FileText },
  { value: "Keys", icon: KeyRound },
  { value: "Electronics", icon: Laptop },
  { value: "Other", icon: Package },
];

export function categoryIcon(c: string): LucideIcon {
  return CATEGORIES.find((x) => x.value === c)?.icon ?? Package;
}

export type ReportRow = {
  id: string;
  kind: "lost" | "found";
  category: string;
  title: string;
  description: string;
  location_name: string;
  map_x: number;
  map_y: number;
  occurred_at: string;
  photo: string | null;
  safe_storage: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
};

export type FindPoint = { id: string; name: string; kind: string; map_x: number; map_y: number; items_in_storage: number; hours: string };

export type MyItem = { id: string; kind: "lost" | "found"; title: string; category: string; location: string; date: string; photo?: string | undefined; status: string; matches?: number };

const KEY = "lostly.myItems";
export function getMyItems(): MyItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveMyItem(item: MyItem) {
  const list = getMyItems().filter((i) => i.id !== item.id);
  localStorage.setItem(KEY, JSON.stringify([item, ...list]));
}
export function updateMyItem(id: string, patch: Partial<MyItem>) {
  localStorage.setItem(KEY, JSON.stringify(getMyItems().map((i) => (i.id === id ? { ...i, ...patch } : i))));
}
export function removeMyItem(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getMyItems().filter((i) => i.id !== id)));
}

export function addPoints(n: number) {
  const v = Number(localStorage.getItem("lostly.points") || "0") + n;
  localStorage.setItem("lostly.points", String(v));
  return v;
}
export function getPoints() {
  return Number(localStorage.getItem("lostly.points") || "0");
}

export async function compressImage(file: File, max = 640): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function timeAgo(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const STATUS_STYLES: Record<string, string> = {
  searching: "bg-primary/15 text-primary",
  "match found": "bg-warm/15 text-warm",
  verifying: "bg-violet/15 text-violet",
  connected: "bg-success/15 text-success",
  returned: "bg-success/25 text-success",
};
