export type Row = {
  id: string; scope: 1 | 2 | 3; scope3_category: number | null; category: string; description: string | null; activity_date: string;
  quantity: number; unit: string; data_quality: string; verification_status: string; kg: number; location: string | null;
  department: string | null; supplier: string | null; period: string | null; factor_source: string | null; factor_value: number | null; factor_unit: string | null; period_id: string | null;
};
const one = (x: any) => (Array.isArray(x) ? x[0] : x);
export async function loadActivity(sb: any, orgId: string, scope?: number): Promise<Row[]> {
  let q = sb.from("activity_records").select("*, emissions_calculations(result_kgco2e, factor_source, factor_value, factor_unit), locations(name), departments(name), suppliers(name), reporting_periods(label)")
    .eq("organisation_id", orgId).order("activity_date", { ascending: false }).limit(5000);
  if (scope) q = q.eq("scope", scope);
  const { data } = await q;
  return (data ?? []).map((a: any) => { const c = one(a.emissions_calculations); return {
    id: a.id, scope: a.scope, scope3_category: a.scope3_category, category: a.category, description: a.description, activity_date: a.activity_date,
    quantity: Number(a.quantity), unit: a.unit, data_quality: a.data_quality, verification_status: a.verification_status, kg: Number(c?.result_kgco2e ?? 0),
    location: one(a.locations)?.name ?? null, department: one(a.departments)?.name ?? null, supplier: one(a.suppliers)?.name ?? null, period: one(a.reporting_periods)?.label ?? null,
    factor_source: c?.factor_source ?? null, factor_value: c ? Number(c.factor_value) : null, factor_unit: c?.factor_unit ?? null, period_id: a.period_id }; });
}
export const sum = (rows: Row[]) => rows.reduce((t, r) => t + r.kg, 0);
export function groupT(rows: Row[], key: (r: Row) => string | null | undefined) {
  const m = new Map<string, number>();
  rows.forEach((r) => { const k = key(r) || "Unassigned"; m.set(k, (m.get(k) ?? 0) + r.kg); });
  return Array.from(m, ([name, v]) => ({ name, value: Math.round(v) / 1000 })).sort((a, b) => b.value - a.value);
}
export const yearOf = (r: Row) => Number(r.activity_date.slice(0, 4));
export function byYear(rows: Row[]) {
  const m = new Map<number, number>(); rows.forEach((r) => m.set(yearOf(r), (m.get(yearOf(r)) ?? 0) + r.kg));
  return Array.from(m, ([year, kg]) => ({ year, kg })).sort((a, b) => a.year - b.year);
}
export function quality(rows: Row[]) {
  const n = rows.length || 1;
  return { estimatedPct: Math.round((rows.filter((r) => r.data_quality === "estimated" || r.data_quality === "assumed").length / n) * 100),
    unverifiedPct: Math.round((rows.filter((r) => r.verification_status === "unverified").length / n) * 100) };
}
