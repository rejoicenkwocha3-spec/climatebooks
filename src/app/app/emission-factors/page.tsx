import { ActionForm, Field, Select } from "@/components/ui";
import { DeleteButton, Empty, NoOrg, PageHeader, Panel, Table } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { ALL_UNITS } from "@/lib/units";
import { createFactor } from "../actions";
export const metadata = { title: "Emission Factors" };

export default async function Factors({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  let query = sb.from("emission_factors").select("*").or(`organisation_id.is.null,organisation_id.eq.${org.id}`).order("name").order("version", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,]/g, "")}%,category.ilike.%${q.replace(/[%,]/g, "")}%,source.ilike.%${q.replace(/[%,]/g, "")}%`);
  const { data } = await query;
  return (<>
    <PageHeader title="Emission Factors" copy="Browse, search and add factors. ClimateBooks ships no invented values: every factor needs a published source, year, geography and unit. Copy values from your chosen source, for example DEFRA, EPA or IEA publications." />
    <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Search by name, category or source" className="input max-w-md" /><button className="btn-outline">Search</button></form>
    {w && <Panel title="Add a custom factor" className="mb-6"><ActionForm action={createFactor} submit="Save factor">
      <Field label="Name" name="name" required placeholder="Grid electricity" /><Field label="Category" name="category" required placeholder="Purchased electricity" />
      <Select label="Scope" name="scope" blank="Any" options={[{ value: 1, label: "Scope 1" }, { value: 2, label: "Scope 2" }, { value: 3, label: "Scope 3" }]} />
      <Field label="Unit the factor applies to" name="unit" required><input id="unit" name="unit" list="fu" className="input" required placeholder="kWh" /><datalist id="fu">{ALL_UNITS.map((u) => <option key={u} value={u} />)}</datalist></Field>
      <Field label="kgCO2e per unit" name="kgco2e_per_unit" type="number" step="any" required /><Field label="Source (publisher and title)" name="source" required />
      <Field label="Publication year" name="publication_year" type="number" required /><Field label="Geography" name="geography" required placeholder="United Kingdom" />
      <Field label="Version" name="version" defaultValue="1" /><Field label="Methodology" name="methodology" placeholder="Location based, GWP100 AR5" />
    </ActionForm></Panel>}
    <Panel title="Factor library">{data?.length ? (<Table head={["Name", "Category", "kgCO2e per unit", "Source", "Year", "Geography", "Version", ""]}>
      {data.map((x: any) => (<tr key={x.id}><td className="td font-medium">{x.name}</td><td className="td">{x.category}</td><td className="td">{Number(x.kgco2e_per_unit)} / {x.unit}</td><td className="td text-xs">{x.source}</td><td className="td">{x.publication_year}</td><td className="td">{x.geography}</td><td className="td">{x.version}</td><td className="td"><DeleteButton table="emission_factors" id={x.id} disabled={!w || !x.organisation_id} /></td></tr>))}</Table>) : <Empty title="No factors" copy="Add your first factor above." />}</Panel>
  </>);
}
