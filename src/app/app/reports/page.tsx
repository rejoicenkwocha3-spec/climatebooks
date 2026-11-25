import { ActionForm, Field, Select } from "@/components/ui";
import { Badge, DeleteButton, Empty, NoOrg, PageHeader, Panel, Table, kg2t } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { createReport, setStatus } from "../actions";
export const metadata = { title: "Reports" };
const FRAMEWORKS = ["GHG Protocol", "CDP", "CSRD", "ESRS", "ISSB", "SECR"];

export default async function Reports() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  const [{ data: periods }, { data: reports }] = await Promise.all([sb.from("cb_reporting_periods").select("id,label").eq("organisation_id", org.id),
    sb.from("cb_reports").select("*").eq("organisation_id", org.id).order("created_at", { ascending: false })]);
  return (<>
    <PageHeader title="Reports" copy="Generate a report snapshot from your recorded data. Framework selection structures the report only: ClimateBooks does not certify regulatory compliance." />
    {w && <Panel title="Generate a report" className="mb-6"><ActionForm action={createReport} submit="Generate report">
      <Field label="Title" name="title" required placeholder="FY2025 greenhouse gas inventory" />
      <Select label="Framework" name="framework" required defaultValue="GHG Protocol" options={FRAMEWORKS.map((f) => ({ value: f, label: f }))} />
      <Select label="Reporting period" name="period_id" blank="All recorded data" options={(periods ?? []).map((p: any) => ({ value: p.id, label: p.label }))} />
    </ActionForm></Panel>}
    <Panel title="Report history">{reports?.length ? (<Table head={["Title", "Framework", "Period", "Total tCO2e", "Status", "Created", "Export", ""]}>
      {reports.map((r: any) => (<tr key={r.id}><td className="td font-medium">{r.title}</td><td className="td">{r.framework}</td><td className="td">{r.snapshot?.period?.label}</td><td className="td">{kg2t(r.snapshot?.totals_kgco2e?.total ?? 0)}</td>
        <td className="td">{w ? (<form action={setStatus} className="flex items-center gap-1"><input type="hidden" name="table" value="reports" /><input type="hidden" name="id" value={r.id} />
          <select name="status" defaultValue={r.status} className="input !w-auto !py-1 text-xs">{["draft", "in_review", "final"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><button className="btn-outline btn-sm">Set</button></form>) : <Badge v={r.status} />}</td>
        <td className="td text-xs">{r.created_at.slice(0, 10)}</td>
        <td className="td whitespace-nowrap"><a className="font-semibold text-forest hover:underline" href={`/api/export?kind=report&id=${r.id}&format=pdf`}>PDF</a> · <a className="font-semibold text-forest hover:underline" href={`/api/export?kind=report&id=${r.id}&format=csv`}>CSV</a></td>
        <td className="td"><DeleteButton table="reports" id={r.id} disabled={!w} /></td></tr>))}</Table>) : <Empty title="No reports yet" />}</Panel>
  </>);
}
