import Link from "next/link";
import { BarCard } from "@/components/charts";
import { Badge, Empty, NoOrg, PageHeader, Panel, Stat, Table, kg2t } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { groupT, loadActivity, sum } from "@/lib/data";
import { SCOPE3_CATEGORIES } from "@/lib/emissions";

const copy: Record<number, string> = {
  1: "Direct emissions from owned and controlled sources: company vehicles, fuel combustion, industrial processes, refrigerants and equipment.",
  2: "Indirect emissions from purchased energy: electricity, heating, cooling and steam.",
  3: "Indirect value chain emissions across the 15 recognised categories.",
};
export async function ScopeView({ scope }: { scope: 1 | 2 | 3 }) {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const rows = await loadActivity(sb, org.id, scope);
  const grouped = scope === 3 ? groupT(rows, (r) => (r.scope3_category ? `${r.scope3_category}. ${SCOPE3_CATEGORIES[r.scope3_category - 1]}` : "Uncategorised")) : groupT(rows, (r) => r.category);
  return (<>
    <PageHeader title={`Scope ${scope} Emissions`} copy={copy[scope]}><Link href="/app/activity" className="btn-primary">Add activity data</Link></PageHeader>
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total" value={`${kg2t(sum(rows))} tCO2e`} /><Stat label="Records" value={String(rows.length)} /><Stat label="Verified by third party" value={String(rows.filter((r) => r.verification_status === "third_party_verified").length)} /></div>
    {rows.length === 0 ? <div className="mt-6"><Empty title={`No Scope ${scope} records yet`} copy="Record activity data with this scope selected." /></div> : (<>
      <Panel title={scope === 3 ? "By Scope 3 category (tCO2e)" : "By category (tCO2e)"} className="mt-6"><BarCard data={grouped} horizontal /></Panel>
      <Panel title="Records" className="mt-6"><Table head={["Date", "Category", "Quantity", "Factor source", "tCO2e", "Quality", "Verification"]}>
        {rows.slice(0, 100).map((r) => (<tr key={r.id}><td className="td">{r.activity_date}</td><td className="td">{r.category}</td><td className="td">{r.quantity.toLocaleString()} {r.unit}</td><td className="td text-xs">{r.factor_source}</td><td className="td font-semibold">{kg2t(r.kg)}</td><td className="td"><Badge v={r.data_quality} /></td><td className="td"><Badge v={r.verification_status} /></td></tr>))}</Table></Panel></>)}
  </>);
}
