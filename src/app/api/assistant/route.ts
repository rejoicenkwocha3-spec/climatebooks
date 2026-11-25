import { NextResponse, type NextRequest } from "next/server";
import { apiUser, currentOrg } from "@/lib/auth";
import { byYear, groupT, loadActivity, quality, sum } from "@/lib/data";

const SYSTEM = `You are the ClimateBooks AI Climate Assistant.
Rules you must follow:
- Answer ONLY from the DATA block below, which is the customer's actual recorded data. Figures are in tonnes CO2e (tCO2e) unless stated.
- Never invent emissions figures, emission factors, benchmarks or regulatory compliance status. If the data needed to answer is missing, say exactly what is missing and how to add it in ClimateBooks.
- Never say the organisation is compliant, aligned or net zero. Targets are commitments, not achievements.
- Always distinguish measured, calculated, estimated and assumed data, and mention data quality limits when they affect the answer.
- Explain Scope 1, 2 and 3 and the formula Emissions = Activity Data x Emission Factor when asked. Recommendations must relate to the hotspots in the data and be labelled as suggestions, not quantified unless the data supports it.
- Be concise. Use plain text with short lists. Do not use emojis.`;

export async function POST(req: NextRequest) {
  if (!(await apiUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sb, org } = await currentOrg();
  if (!org) return NextResponse.json({ error: "Create an organisation first." }, { status: 400 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "The AI assistant is not configured: ANTHROPIC_API_KEY is missing on the server." }, { status: 503 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const messages = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
    .filter((m: any) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Ask a question." }, { status: 400 });

  const rows = await loadActivity(sb, org.id);
  const [{ data: targets }, { data: inits }, { data: subs }] = await Promise.all([
    sb.from("climate_targets").select("name,target_type,baseline_year,target_year,reduction_percent,scope_coverage").eq("organisation_id", org.id),
    sb.from("reduction_initiatives").select("title,status,expected_reduction_kgco2e,basis").eq("organisation_id", org.id),
    sb.from("supplier_submissions").select("reported_kgco2e,status").eq("organisation_id", org.id)]);
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const catMed = new Map<string, number>(); groupT(rows, (r) => r.category).forEach((g) => catMed.set(g.name, med(rows.filter((r) => r.category === g.name).map((r) => r.kg))));
  const unusual = rows.filter((r) => { const m = catMed.get(r.category) ?? 0; return rows.filter((x) => x.category === r.category).length >= 4 && m > 0 && r.kg > 5 * m; })
    .slice(0, 8).map((r) => ({ date: r.activity_date, category: r.category, quantity: `${r.quantity} ${r.unit}`, tCO2e: +(r.kg / 1000).toFixed(3), note: "more than 5x the median record in its category" }));
  const data = {
    organisation: { name: org.name, industry: org.industry, country: org.country, base_year: org.base_year, boundary: org.boundary_approach },
    record_count: rows.length, totals_tCO2e: { total: +(sum(rows) / 1000).toFixed(3), scope1: +(sum(rows.filter((r) => r.scope === 1)) / 1000).toFixed(3), scope2: +(sum(rows.filter((r) => r.scope === 2)) / 1000).toFixed(3), scope3: +(sum(rows.filter((r) => r.scope === 3)) / 1000).toFixed(3) },
    by_year_tCO2e: byYear(rows).map((y) => ({ year: y.year, tCO2e: +(y.kg / 1000).toFixed(3) })),
    by_category_tCO2e: groupT(rows, (r) => r.category).slice(0, 15), by_location_tCO2e: groupT(rows, (r) => r.location).slice(0, 15),
    scope3_by_category_tCO2e: groupT(rows.filter((r) => r.scope === 3), (r) => r.category).slice(0, 15),
    data_quality: quality(rows), factor_sources_used: Array.from(new Set(rows.map((r) => r.factor_source).filter(Boolean))),
    unusual_records: unusual, targets, initiatives: inits, supplier_submissions: (subs ?? []).length,
    formula: "Emissions = Activity Data x Emission Factor, with unit conversion; each record stores its factor, source, year and geography.",
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 1200, system: `${SYSTEM}\n\nDATA:\n${JSON.stringify(data)}`, messages }),
  });
  if (!r.ok) { const t = await r.text(); return NextResponse.json({ error: `AI service error (${r.status}). ${t.slice(0, 200)}` }, { status: 502 }); }
  const j = await r.json();
  return NextResponse.json({ reply: (j.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n") });
}
