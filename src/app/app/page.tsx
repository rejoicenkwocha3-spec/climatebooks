import Link from "next/link";
import { BarCard, PieCard } from "@/components/charts";
import { Badge, Empty, NoOrg, PageHeader, Panel, Stat, Table, kg2t } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { byYear, groupT, loadActivity, quality, sum } from "@/lib/data";
export const metadata = { title: "Overview" };

export default async function Overview() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const rows = await loadActivity(sb, org.id);
  const [{ data: periods }, { data: targets }] = await Promise.all([
    sb.from("cb_reporting_periods").select("*").eq("organisation_id", org.id).eq("status", "open").not("due_date", "is", null).order("due_date").limit(5),
    sb.from("cb_climate_targets").select("*").eq("organisation_id", org.id).order("created_at").limit(1)]);
  const total = sum(rows), s = [1, 2, 3].map((n) => sum(rows.filter((r) => r.scope === n)));
  const years = byYear(rows), q = quality(rows);
  const last = years[years.length - 1], prev = years[years.length - 2];
  const yoy = last && prev && prev.kg > 0 ? ((last.kg - prev.kg) / prev.kg) * 100 : null;
  const t = targets?.[0]; let progress: string | null = null;
  if (t) { const base = years.find((y) => y.year === t.baseline_year); if (base && last && base.kg > 0) {
    const achieved = ((base.kg - last.kg) / base.kg) * 100; progress = `${achieved.toFixed(1)}% reduced vs ${t.baseline_year} baseline (target ${t.reduction_percent}% by ${t.target_year})`; } else progress = `No recorded data for the ${t.baseline_year} baseline year yet.`; }
  return (
    <>
      <PageHeader title="Overview" copy={`${org.name}. All figures are calculated from the activity data you have recorded.`}>
        <Link href="/app/activity" className="btn-primary">Add activity data</Link>
      </PageHeader>
      {rows.length === 0 ? (
        <Empty title="No activity data yet" copy="Add an emission factor with its source, then record activity data. Your totals and charts will appear here." action={<Link href="/app/emission-factors" className="btn-primary">Set up emission factors</Link>} />
      ) : (<>
        {(q.estimatedPct > 0 || q.unverifiedPct > 0) && (
          <p className="mb-4 rounded-lg border border-gold/50 bg-gold/15 p-3 text-sm text-emerald">Data completeness: {q.estimatedPct}% of records are estimated or assumed, and {q.unverifiedPct}% are unverified. Totals include these records.</p>)}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total emissions" value={`${kg2t(total)} tCO2e`} sub={yoy === null ? "Year over year: needs two years of data" : `${yoy > 0 ? "+" : ""}${yoy.toFixed(1)}% vs ${prev!.year}`} />
          <Stat label="Scope 1" value={`${kg2t(s[0])} tCO2e`} /><Stat label="Scope 2" value={`${kg2t(s[1])} tCO2e`} /><Stat label="Scope 3" value={`${kg2t(s[2])} tCO2e`} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Emissions by category (tCO2e)"><PieCard data={groupT(rows, (r) => r.category).slice(0, 8)} /></Panel>
          <Panel title="Emissions by location (tCO2e)"><BarCard data={groupT(rows, (r) => r.location)} /></Panel>
          <Panel title="Year over year (tCO2e)"><BarCard data={years.map((y) => ({ name: String(y.year), value: Math.round(y.kg) / 1000 }))} /></Panel>
          <Panel title="Carbon reduction progress">{t ? (<><p className="font-semibold text-emerald">{t.name}</p><p className="mt-2 text-sm">{progress}</p>
            <p className="mt-3 text-xs text-charcoal/60">A target is a commitment, not an achievement. ClimateBooks does not label an organisation net zero.</p></>) : <Empty title="No target set" action={<Link href="/app/targets" className="btn-outline btn-sm">Set a target</Link>} />}</Panel>
          <Panel title="Upcoming reporting deadlines">{periods?.length ? (<ul className="divide-y divide-forest/10 text-sm">{periods.map((p: any) => (<li key={p.id} className="flex justify-between py-2"><span>{p.label}</span><span className="text-charcoal/70">Due {p.due_date}</span></li>))}</ul>) : <p className="text-sm text-charcoal/65">No open periods with a due date. Add one under Organisations.</p>}</Panel>
          <Panel title="Recent activity"><Table head={["Date", "Category", "tCO2e", "Quality"]}>{rows.slice(0, 5).map((r) => (<tr key={r.id}><td className="td">{r.activity_date}</td><td className="td">{r.category}</td><td className="td">{kg2t(r.kg)}</td><td className="td"><Badge v={r.data_quality} /></td></tr>))}</Table></Panel>
        </div></>)}
    </>
  );
}
