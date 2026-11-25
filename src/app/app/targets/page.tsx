import { TargetChart } from "@/components/charts";
import { Scenario } from "@/components/Scenario";
import { ActionForm, Field, Select } from "@/components/ui";
import { DeleteButton, Empty, NoOrg, PageHeader, Panel, kg2t } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { byYear, loadActivity, sum } from "@/lib/data";
import { createTarget } from "../actions";
export const metadata = { title: "Climate Targets" };

export default async function Targets() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  const [rows, { data: targets }] = await Promise.all([loadActivity(sb, org.id), sb.from("cb_climate_targets").select("*").eq("organisation_id", org.id).order("created_at")]);
  const years = byYear(rows); const s = [1, 2, 3].map((n) => sum(rows.filter((r) => r.scope === n)));
  return (<>
    <PageHeader title="Climate Targets" copy="Set baseline and target years and track progress. Setting a target does not make an organisation net zero." />
    {w && <Panel title="New target" className="mb-6"><ActionForm action={createTarget} submit="Save target">
      <Field label="Name" name="name" required placeholder="50% absolute reduction" />
      <Select label="Type" name="target_type" required defaultValue="reduction" options={[{ value: "reduction", label: "Emission reduction" }, { value: "net_zero", label: "Net zero commitment" }]} />
      <Field label="Baseline year" name="baseline_year" type="number" required /><Field label="Target year" name="target_year" type="number" required />
      <Field label="Reduction percentage" name="reduction_percent" type="number" step="any" required /><Select label="Scope coverage" name="scope_coverage" required defaultValue="all" options={[{ value: "all", label: "All scopes" }, { value: "1", label: "Scope 1" }, { value: "2", label: "Scope 2" }, { value: "1+2", label: "Scopes 1 and 2" }, { value: "3", label: "Scope 3" }]} />
    </ActionForm></Panel>}
    {targets?.length ? <div className="space-y-6">{targets.map((t: any) => {
      const base = years.find((y) => y.year === t.baseline_year); const last = years[years.length - 1];
      const data = []; for (let y = t.baseline_year; y <= t.target_year; y++) data.push({ year: y, actual: years.find((x) => x.year === y) ? Math.round(years.find((x) => x.year === y)!.kg) / 1000 : undefined,
        pathway: base ? Math.round(base.kg * (1 - (t.reduction_percent / 100) * ((y - t.baseline_year) / (t.target_year - t.baseline_year)))) / 1000 : undefined });
      const achieved = base && last && base.kg > 0 ? ((base.kg - last.kg) / base.kg) * 100 : null;
      return (<Panel key={t.id} title={t.name}><div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{t.reduction_percent}% from {t.baseline_year} to {t.target_year} ({String(t.scope_coverage)}) {t.target_type === "net_zero" && <em className="text-charcoal/60">Commitment only. Not an achievement.</em>}</span><DeleteButton table="climate_targets" id={t.id} disabled={!w} /></div>
        {base ? (<><p className="mb-2 text-sm">Baseline {kg2t(base.kg)} tCO2e. {achieved !== null && last && last.year !== t.baseline_year ? `Latest recorded year ${last.year}: ${achieved.toFixed(1)}% change in reduction terms.` : "No later year recorded yet."}</p><TargetChart data={data} /></>) : <p className="text-sm text-charcoal/65">No data recorded for {t.baseline_year}, so progress cannot be calculated.</p>}</Panel>); })}</div> : <Empty title="No targets yet" />}
    {rows.length > 0 && <Panel title="Scenario modelling" className="mt-6"><Scenario s1={s[0]} s2={s[1]} s3={s[2]} /></Panel>}
  </>);
}
