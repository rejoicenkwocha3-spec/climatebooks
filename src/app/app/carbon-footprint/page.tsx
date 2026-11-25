import { BarCard, PieCard } from "@/components/charts";
import { NoOrg, PageHeader, Panel, Stat, kg2t } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { groupT, loadActivity, quality, sum } from "@/lib/data";
export const metadata = { title: "Carbon Footprint" };
export default async function Footprint() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const rows = await loadActivity(sb, org.id); const q = quality(rows);
  return (<>
    <PageHeader title="Carbon Footprint" copy="Your combined Scope 1, 2 and 3 footprint, calculated as activity data multiplied by an emission factor." />
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total" value={`${kg2t(sum(rows))} tCO2e`} /><Stat label="Records" value={String(rows.length)} /><Stat label="Estimated or assumed" value={`${q.estimatedPct}%`} sub={`${q.unverifiedPct}% unverified`} /></div>
    {rows.length > 0 && <div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="By scope (tCO2e)"><PieCard data={groupT(rows, (r) => `Scope ${r.scope}`)} /></Panel><Panel title="By category (tCO2e)"><BarCard data={groupT(rows, (r) => r.category).slice(0, 8)} horizontal /></Panel></div>}
  </>);
}
