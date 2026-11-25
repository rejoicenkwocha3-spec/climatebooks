import { ActionForm, Field, Select } from "@/components/ui";
import { DeleteButton, Empty, PageHeader, Panel, Table } from "@/components/app";
import { currentOrg, canWrite } from "@/lib/auth";
import { addDepartment, addLocation, addPeriod, createOrganisation, updateOrganisation } from "../actions";
export const metadata = { title: "Organisations" };

export default async function Organisations() {
  const { sb, org, orgs } = await currentOrg();
  const [loc, dep, per] = org ? await Promise.all([
    sb.from("cbk_locations").select("*").eq("organisation_id", org.id).order("name"), sb.from("cbk_departments").select("*").eq("organisation_id", org.id).order("name"),
    sb.from("cbk_reporting_periods").select("*").eq("organisation_id", org.id).order("start_date", { ascending: false })]) : [];
  const w = canWrite(org?.role), admin = org && ["owner", "admin"].includes(org.role);
  return (
    <>
      <PageHeader title="Organisations" copy="Create organisations, define the reporting boundary and manage locations, departments and reporting periods. Multiple organisations require an active subscription." />
      <div className="space-y-6">
        <Panel title="Create an organisation"><ActionForm action={createOrganisation} submit="Create organisation">
          <Field label="Name" name="name" required /><Field label="Industry" name="industry" /><Field label="Country" name="country" /><Field label="Base year" name="base_year" type="number" placeholder="2024" />
        </ActionForm></Panel>
        {org && (<>
          <Panel title={`Details and boundary: ${org.name}`}>
            {admin ? (<ActionForm action={updateOrganisation}>
              <Field label="Name" name="name" defaultValue={org.name} required /><Field label="Industry" name="industry" defaultValue={org.industry ?? ""} />
              <Field label="Country" name="country" defaultValue={org.country ?? ""} /><Field label="Base year" name="base_year" type="number" defaultValue={org.base_year ?? ""} />
              <Select label="Consolidation approach" name="boundary_approach" required defaultValue={org.boundary_approach} options={[{ value: "operational_control", label: "Operational control" }, { value: "financial_control", label: "Financial control" }, { value: "equity_share", label: "Equity share" }]} />
              <Field label="Boundary notes" name="boundary_notes"><textarea id="boundary_notes" name="boundary_notes" defaultValue={org.boundary_notes ?? ""} className="input" rows={3} placeholder="Entities, sites and exclusions in scope" /></Field>
            </ActionForm>) : <p className="text-sm text-charcoal/70">Only owners and admins can edit organisation details.</p>}
            <p className="mt-3 text-xs text-charcoal/60">{orgs.length} organisation(s) in your account.</p>
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Business locations">
              {w && <ActionForm action={addLocation} submit="Add location"><Field label="Name" name="name" required /><Field label="Country" name="country" /></ActionForm>}
              {loc?.data?.length ? <Table head={["Name", "Country", ""]}>{loc.data.map((l: any) => (<tr key={l.id}><td className="td">{l.name}</td><td className="td">{l.country}</td><td className="td"><DeleteButton table="locations" id={l.id} disabled={!w} /></td></tr>))}</Table> : <div className="mt-4"><Empty title="No locations" /></div>}
            </Panel>
            <Panel title="Departments">
              {w && <ActionForm action={addDepartment} submit="Add department"><Field label="Name" name="name" required className="sm:col-span-2" /></ActionForm>}
              {dep?.data?.length ? <Table head={["Name", ""]}>{dep.data.map((d: any) => (<tr key={d.id}><td className="td">{d.name}</td><td className="td"><DeleteButton table="departments" id={d.id} disabled={!w} /></td></tr>))}</Table> : <div className="mt-4"><Empty title="No departments" /></div>}
            </Panel>
          </div>
          <Panel title="Reporting periods">
            {w && <ActionForm action={addPeriod} submit="Add period"><Field label="Label" name="label" required placeholder="FY2025" /><Field label="Due date" name="due_date" type="date" /><Field label="Start" name="start_date" type="date" required /><Field label="End" name="end_date" type="date" required /></ActionForm>}
            {per?.data?.length ? <Table head={["Label", "Start", "End", "Due", ""]}>{per.data.map((p: any) => (<tr key={p.id}><td className="td">{p.label}</td><td className="td">{p.start_date}</td><td className="td">{p.end_date}</td><td className="td">{p.due_date ?? ""}</td><td className="td"><DeleteButton table="reporting_periods" id={p.id} disabled={!w} /></td></tr>))}</Table> : <div className="mt-4"><Empty title="No reporting periods" /></div>}
          </Panel>
        </>)}
      </div>
    </>
  );
}
