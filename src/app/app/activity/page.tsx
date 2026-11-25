import { ActionForm, Field, Select } from "@/components/ui";
import { Badge, DeleteButton, Empty, NoOrg, PageHeader, Panel, Table, kg2t } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { loadActivity } from "@/lib/data";
import { ALL_UNITS } from "@/lib/units";
import { SCOPE3_CATEGORIES } from "@/lib/emissions";
import { createActivity } from "../actions";
export const metadata = { title: "Activity Data" };

export default async function Activity() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role); const o = org.id;
  const [rows, f, l, d, p, s] = await Promise.all([loadActivity(sb, o),
    sb.from("cb_emission_factors").select("id,name,unit,source,publication_year,geography").or(`organisation_id.is.null,organisation_id.eq.${o}`).eq("is_active", true).order("name"),
    sb.from("cb_locations").select("id,name").eq("organisation_id", o), sb.from("cb_departments").select("id,name").eq("organisation_id", o),
    sb.from("cb_reporting_periods").select("id,label").eq("organisation_id", o), sb.from("cb_suppliers").select("id,name").eq("organisation_id", o)]);
  const opt = (x: any) => (x.data ?? []).map((r: any) => ({ value: r.id, label: r.name ?? r.label }));
  return (<>
    <PageHeader title="Activity Data" copy="Emissions = Activity Data x Emission Factor. Every record stores the quantity, unit, factor, source and result.">
      <a href="/api/export?kind=activity" className="btn-outline">Export CSV</a></PageHeader>
    {w && (<Panel title="Record activity" className="mb-6">
      {f.data?.length ? (<ActionForm action={createActivity} submit="Calculate and save" className="grid gap-4 sm:grid-cols-3">
        <Select label="Scope" name="scope" required options={[{ value: 1, label: "Scope 1" }, { value: 2, label: "Scope 2" }, { value: 3, label: "Scope 3" }]} />
        <Select label="Scope 3 category" name="scope3_category" blank="Not applicable" options={SCOPE3_CATEGORIES.map((c, i) => ({ value: i + 1, label: `${i + 1}. ${c}` }))} />
        <Field label="Date" name="activity_date" type="date" />
        <Select label="Emission factor" name="factor_id" required options={(f.data ?? []).map((x: any) => ({ value: x.id, label: `${x.name} (per ${x.unit}, ${x.source} ${x.publication_year}, ${x.geography})` }))} className="sm:col-span-2" />
        <Field label="Description" name="description" />
        <Field label="Quantity" name="quantity" type="number" step="any" required />
        <Field label="Unit" name="unit" required><input id="unit" name="unit" list="units" className="input" required placeholder="kWh" /><datalist id="units">{ALL_UNITS.map((u) => <option key={u} value={u} />)}</datalist></Field>
        <Select label="Reporting period" name="period_id" options={opt(p)} />
        <Select label="Location" name="location_id" options={opt(l)} /><Select label="Department" name="department_id" options={opt(d)} /><Select label="Supplier" name="supplier_id" options={opt(s)} />
        <Select label="Data quality" name="data_quality" required defaultValue="estimated" options={["measured", "calculated", "estimated", "assumed"].map((v) => ({ value: v, label: v }))} />
        <Select label="Verification" name="verification_status" required defaultValue="unverified" options={[{ value: "unverified", label: "Unverified" }, { value: "internally_reviewed", label: "Internally reviewed" }, { value: "third_party_verified", label: "Third party verified" }]} />
      </ActionForm>) : <Empty title="Add an emission factor first" copy="ClimateBooks never invents factors. Add one with its published source on the Emission Factors page." />}
    </Panel>)}
    <Panel title="Records and audit trail">
      {rows.length === 0 ? <Empty title="No records yet" /> : (<Table head={["Date", "Scope", "Category", "Quantity", "Factor", "tCO2e", "Quality", "Verification", ""]}>
        {rows.slice(0, 200).map((r) => (<tr key={r.id}><td className="td">{r.activity_date}</td><td className="td">{r.scope}{r.scope3_category ? `.${r.scope3_category}` : ""}</td><td className="td">{r.category}</td>
          <td className="td">{r.quantity.toLocaleString()} {r.unit}</td><td className="td text-xs">{r.factor_value} kgCO2e per {r.factor_unit}<br />{r.factor_source}</td><td className="td font-semibold">{kg2t(r.kg)}</td>
          <td className="td"><Badge v={r.data_quality} /></td><td className="td"><Badge v={r.verification_status} /></td><td className="td"><DeleteButton table="activity_records" id={r.id} disabled={!w} /></td></tr>))}</Table>)}
    </Panel>
  </>);
}
