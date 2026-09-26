import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Fingerprint = {
  color?: string;
  shape?: string;
  brand?: string;
  pattern?: string;
  accessories?: string[];
  marks?: string[];
  text?: string;
  features?: string[];
  summary?: string;
};

const fingerprintSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    color: { type: "string" },
    shape: { type: "string" },
    brand: { type: "string" },
    pattern: { type: "string" },
    accessories: { type: "array", items: { type: "string" } },
    marks: { type: "array", items: { type: "string" } },
    text: { type: "string" },
    features: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["color", "shape", "brand", "pattern", "accessories", "marks", "text", "features", "summary"],
};

const COLORS = ["black", "white", "red", "blue", "green", "yellow", "brown", "grey", "gray", "silver", "gold", "pink", "purple", "orange", "navy", "beige"];

function heuristicFingerprint(category: string, description: string): Fingerprint {
  const d = description.toLowerCase();
  const color = COLORS.find((c) => d.includes(c)) ?? "";
  const words = d.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  return {
    color,
    shape: category.toLowerCase(),
    brand: "",
    pattern: "",
    accessories: words.filter((w) => ["keychain", "sticker", "case", "strap", "tag", "charm"].some((a) => w.includes(a))),
    marks: [],
    text: "",
    features: words.slice(0, 6),
    summary: description.slice(0, 140),
  };
}

function extractText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const o of data?.output ?? []) {
    for (const c of o?.content ?? []) {
      if (typeof c?.text === "string") return c.text;
    }
  }
  return "";
}

export const analyzeItem = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        image: z.string().max(3_000_000).optional(),
        category: z.string().max(40),
        description: z.string().max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ fingerprint: Fingerprint; source: "ai" | "fallback"; note?: string | undefined }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { fingerprint: heuristicFingerprint(data.category, data.description), source: "fallback" };
    const content: any[] = [
      {
        type: "input_text",
        text: `You create a visual "item fingerprint" for a lost-and-found matching system. Category: ${data.category}. Owner/finder notes: ${data.description || "(none)"}. Describe only what is visible or stated. Use short lowercase phrases. Use empty strings/arrays when unknown. Never include personal data such as names, ID numbers or card numbers.`,
      },
    ];
    if (data.image) content.push({ type: "input_image", image_url: data.image });
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          input: [{ role: "user", content }],
          text: { format: { type: "json_schema", name: "item_fingerprint", schema: fingerprintSchema, strict: true } },
        }),
      });
      if (!res.ok) {
        const note = res.status === 402 ? "AI credits are used up — used basic analysis instead." : res.status === 429 ? "AI is busy — used basic analysis instead." : undefined;
        console.error("analyzeItem gateway", res.status, await res.text());
        return { fingerprint: heuristicFingerprint(data.category, data.description), source: "fallback", note };
      }
      const json = await res.json();
      const fp = JSON.parse(extractText(json)) as Fingerprint;
      return { fingerprint: fp, source: "ai" };
    } catch (e) {
      console.error("analyzeItem", e);
      return { fingerprint: heuristicFingerprint(data.category, data.description), source: "fallback" };
    }
  });

const reportInput = z.object({
  kind: z.enum(["lost", "found"]),
  category: z.string().min(1).max(40),
  title: z.string().min(2).max(120),
  description: z.string().max(1000),
  location_name: z.string().min(2).max(160),
  map_x: z.number().min(0).max(100),
  map_y: z.number().min(0).max(100),
  occurred_at: z.string(),
  photo: z.string().max(3_000_000).optional(),
  fingerprint: z.record(z.any()),
  safe_storage: z.string().max(160).optional(),
  verify_question: z.string().max(200).optional(),
  verify_answer: z.string().max(200).optional(),
});

export const createReport = createServerFn({ method: "POST" })
  .inputValidator((d) => reportInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verify_answer, ...row } = data;
    const { data: inserted, error } = await supabaseAdmin
      .from("reports")
      .insert({ ...row, photo: row.photo ?? null, safe_storage: row.safe_storage ?? null, fingerprint: row.fingerprint as any, verify_question: row.kind === "found" ? row.verify_question || null : null })
      .select("id")
      .single();
    if (error) throw new Error("Could not save the report. Please try again.");
    if (data.kind === "found" && verify_answer) {
      await supabaseAdmin.from("report_secrets").insert({ report_id: inserted.id, answer: verify_answer.toLowerCase().trim() });
    }
    return { id: inserted.id as string };
  });

function tokens(s: string) {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !["the", "and", "with", "near", "found", "lost", "was"].includes(w)),
  );
}
function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  a.forEach((x) => b.has(x) && n++);
  return n / Math.min(a.size, b.size);
}
function fpText(f: Fingerprint) {
  return [f.color, f.shape, f.brand, f.pattern, f.text, ...(f.accessories ?? []), ...(f.marks ?? []), ...(f.features ?? [])].join(" ");
}

export type MatchResult = {
  id: string;
  title: string;
  category: string;
  location_name: string;
  occurred_at: string;
  safe_storage: string | null;
  verify_question: string | null;
  photo: string | null;
  overall: number;
  visual: number;
  description: number;
  location: "High" | "Medium" | "Low";
  time: "High" | "Medium" | "Low";
  distanceKm: number;
  reasons: string[];
};

export const findMatches = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        category: z.string(),
        description: z.string(),
        map_x: z.number(),
        map_y: z.number(),
        occurred_at: z.string(),
        fingerprint: z.record(z.any()),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ searched: number; matches: MatchResult[] }> => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false },
    });
    const { data: rows, error } = await sb
      .from("reports")
      .select("id,title,category,description,location_name,map_x,map_y,occurred_at,fingerprint,safe_storage,verify_question,photo")
      .eq("kind", "found")
      .limit(500);
    if (error) throw new Error("Could not search community reports right now.");
    const fp = data.fingerprint as Fingerprint;
    const lostAt = new Date(data.occurred_at).getTime();
    const results: MatchResult[] = (rows ?? []).map((r: any) => {
      const rf = (r.fingerprint ?? {}) as Fingerprint;
      const reasons: string[] = [];
      let visual = 0.25 * overlap(tokens(fpText(fp)), tokens(fpText(rf)));
      if (fp.color && rf.color && rf.color.includes(fp.color.split(" ")[0] ?? "")) { visual += 0.3; reasons.push(`Same color (${rf.color})`); }
      if (fp.shape && rf.shape && overlap(tokens(fp.shape), tokens(rf.shape)) > 0) { visual += 0.2; reasons.push("Similar shape"); }
      if (fp.brand && rf.brand && overlap(tokens(fp.brand), tokens(rf.brand)) > 0) { visual += 0.1; reasons.push("Same brand or logo"); }
      const acc = overlap(tokens((fp.accessories ?? []).join(" ")), tokens((rf.accessories ?? []).join(" ")));
      if (acc > 0) { visual += 0.15; reasons.push("Matching accessory"); }
      if (r.category === data.category) visual += 0.1;
      visual = Math.min(1, visual);
      const desc = Math.min(1, overlap(tokens(data.description + " " + fpText(fp)), tokens(r.description + " " + r.title)) * 1.2);
      const dist = Math.hypot(Number(r.map_x) - data.map_x, Number(r.map_y) - data.map_y) * 0.08;
      const location = dist < 1.5 ? "High" : dist < 4 ? "Medium" : "Low";
      if (location !== "Low") reasons.push(`Reported ${dist.toFixed(1)} km away`);
      const hours = (new Date(r.occurred_at).getTime() - lostAt) / 36e5;
      const time = hours > -12 && hours < 72 ? "High" : hours > -48 && hours < 240 ? "Medium" : "Low";
      if (time === "High") reasons.push("Found shortly after you lost it");
      const locS = location === "High" ? 1 : location === "Medium" ? 0.6 : 0.2;
      const timeS = time === "High" ? 1 : time === "Medium" ? 0.6 : 0.2;
      const catPenalty = r.category === data.category ? 1 : 0.55;
      const overall = Math.round((visual * 0.45 + desc * 0.15 + locS * 0.25 + timeS * 0.15) * catPenalty * 100);
      return {
        id: r.id, title: r.title, category: r.category, location_name: r.location_name, occurred_at: r.occurred_at,
        safe_storage: r.safe_storage, verify_question: r.verify_question, photo: r.photo,
        overall, visual: Math.round(visual * 100), description: Math.round(desc * 100), location, time,
        distanceKm: Number(dist.toFixed(1)), reasons,
      };
    });
    return {
      searched: rows?.length ?? 0,
      matches: results.filter((m) => m.overall >= 35).sort((a, b) => b.overall - a.overall).slice(0, 5),
    };
  });

export const verifyOwnership = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ reportId: z.string().uuid(), answer: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: secret } = await supabaseAdmin.from("report_secrets").select("answer").eq("report_id", data.reportId).maybeSingle();
    if (!secret) return { verified: false, message: "The finder hasn't set a verification question yet. They'll review your claim manually." };
    const a = tokens(secret.answer);
    const b = tokens(data.answer);
    const ok = overlap(a, b) >= 0.5 || data.answer.toLowerCase().includes(secret.answer);
    if (ok) await supabaseAdmin.from("reports").update({ status: "connected" }).eq("id", data.reportId);
    return {
      verified: ok,
      message: ok ? "Ownership verified. You and the finder can now connect safely." : "That answer doesn't match the finder's details. Details stay private until verified.",
    };
  });
