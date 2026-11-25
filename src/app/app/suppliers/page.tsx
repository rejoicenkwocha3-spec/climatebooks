import { ActionForm, Field, Select } from "@/components/ui";
import { Badge, DeleteButton, Empty, NoOrg, PageHeader, Panel, Table, kg2t } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { addSubmission, createSupplier, reviewSubmission } from "../actions";
export const metadata = { title: "Suppliers" };
export default async function Suppliers() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  const [{ data: sup }, { data: subs }, { data: periods }] = await Promise.all([sb.from("suppliers").select("*").eq("organisation_id", org.id).order("name"),
    sb.from("supplier_submissions").select("*, suppliers(name)").eq("organisation_id", org.id).order("created_at", { ascending: false }),
    sb.from("reporting_periods").select("id,label").eq("organisation_id", org.id)]);
  return (<>
    <PageHeader title="Suppliers" copy="Manage suppliers, record the emissions data they send and review each submission before relying on it." />
    {w && <div className="mb-6 grid gap-6 lg:grid-cols-2">
      <Panel title="Add supplier"><ActionForm action={createSupplier} submit="Add supplier"><Field label="Name" name="name" required /><Field label="Contact email" name="contact_email" type="email" /><Field label="Country" name="country" /><Field label="Category" name="category" /></ActionForm></Panel>
      <Panel title="Record a submission"><ActionForm action={addSubmission} submit="Record submission">
        <Select label="Supplier" name="supplier_id" required options={(sup ?? []).map((s: any) => ({ value: s.id, label: s.name }))} /><Select label="Period" name="period_id" options={(periods ?? []).map((p: any) => ({ value: p.id, label: p.label }))} />
        <Field label="Reported emissions (tCO2e)" name="reported_tonnes" type="number" step="any" required /><Field label="Methodology" name="methodology" /><Field label="Notes" name="notes" className="sm:col-span-2" />
      </ActionForm></Panel></div>}
    <Panel title="Supplier register">{sup?.length ? (<Table head={["Supplier", "Contact", "Country", "Category", "Status", ""]}>{sup.map((s: any) => (<tr key={s.id}><td className="td font-medium">{s.name}</td><td className="td">{s.contact_email ? <a className="text-forest hover:underline" href={`mailto:${s.contact_email}?subject=${encodeURIComponent("Sustainability data request")}`}>{s.contact_email}</a> : ""}</td><td className="td">{s.country}</td><td className="td">{s.category}</td><td className="td"><Badge v={s.status} /></td><td className="td"><DeleteButton table="suppliers" id={s.id} disabled={!w} /></td></tr>))}</Table>) : <Empty title="No suppliers yet" />}</Panel>
    <Panel title="Submissions for review" className="mt-6">{subs?.length ? (<Table head={["Supplier", "tCO2e", "Methodology", "Status", "Review"]}>{subs.map((s: any) => (<tr key={s.id}><td className="td">{s.suppliers?.name}</td><td className="td">{kg2t(Number(s.reported_kgco2e ?? 0))}</td><td className="td">{s.methodology}</td><td className="td"><Badge v={s.status} /></td>
      <td className="td">{w && s.status === "submitted" ? (<div className="flex gap-2">{["approved", "rejected"].map((st) => (<form key={st} action={reviewSubmission}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value={st} /><button className="btn-outline btn-sm capitalize">{st === "approved" ? "Approve" : "Reject"}</button></form>))}</div>) : null}</td></tr>))}</Table>) : <Empty title="No submissions yet" />}</Panel>
  </>);
}
