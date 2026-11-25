import { BarCard, PieCard } from "@/components/charts";
import { Empty, NoOrg, PageHeader, Panel } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { groupT, loadActivity } from "@/lib/data";
export const metadata = { title: "Analytics" };
export default async function Analytics() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const rows = await loadActivity(sb, org.id);
  if (!rows.length) return <><PageHeader title="Analytics" /><Empty title="No data to analyse yet" copy="Record activity data to see emissions by scope, location, department, supplier and category." /></>;
  return (<><PageHeader title="Analytics" copy="Emissions in tCO2e. Rows without an assigned location, department or supplier appear as Unassigned." />
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="By scope"><PieCard data={groupT(rows, (r) => `Scope ${r.scope}`)} /></Panel>
      <Panel title="By category"><BarCard data={groupT(rows, (r) => r.category).slice(0, 10)} horizontal /></Panel>
      <Panel title="By location"><BarCard data={groupT(rows, (r) => r.location)} /></Panel>
      <Panel title="By department"><BarCard data={groupT(rows, (r) => r.department)} /></Panel>
      <Panel title="By supplier"><BarCard data={groupT(rows, (r) => r.supplier)} /></Panel>
      <Panel title="By month"><BarCard data={groupT(rows, (r) => r.activity_date.slice(0, 7)).sort((a, b) => a.name.localeCompare(b.name))} /></Panel>
    </div></>);
}
