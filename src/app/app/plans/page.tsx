import { ActionForm, Field, Select } from "@/components/ui";
import { Badge, DeleteButton, Empty, NoOrg, PageHeader, Panel, Table, kg2t } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
import { createInitiative, setStatus } from "../actions";
export const metadata = { title: "Reduction Plans" };
export default async function Plans() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  const [{ data: items }, { data: targets }] = await Promise.all([sb.from("cb_reduction_initiatives").select("*, climate_targets:cb_climate_targets(name)").eq("organisation_id", org.id).order("created_at", { ascending: false }),
    sb.from("cb_climate_targets").select("id,name").eq("organisation_id", org.id)]);
  const planned = (items ?? []).filter((i: any) => i.status !== "cancelled").reduce((t: number, i: any) => t + Number(i.expected_reduction_kgco2e ?? 0), 0);
  return (<>
    <PageHeader title="Reduction Plans" copy="Track the initiatives that deliver your targets. Expected reductions are estimates until measured." />
    {w && <Panel title="New initiative" className="mb-6"><ActionForm action={createInitiative} submit="Save initiative">
      <Field label="Title" name="title" required /><Select label="Linked target" name="target_id" options={(targets ?? []).map((t: any) => ({ value: t.id, label: t.name }))} />
      <Field label="Expected reduction (tCO2e per year)" name="expected_tonnes" type="number" step="any" /><Field label="Due date" name="due_date" type="date" />
      <Select label="Status" name="status" required defaultValue="planned" options={["planned", "in_progress", "completed", "cancelled"].map((v) => ({ value: v, label: v.replace("_", " ") }))} />
      <Select label="Basis of estimate" name="basis" required defaultValue="estimated" options={["estimated", "modelled", "measured"].map((v) => ({ value: v, label: v }))} />
      <Field label="Description" name="description" className="sm:col-span-2" />
    </ActionForm></Panel>}
    <Panel title={`Initiatives (expected total ${kg2t(planned)} tCO2e)`}>{items?.length ? (<Table head={["Title", "Target", "Expected tCO2e", "Basis", "Due", "Status", ""]}>
      {items.map((i: any) => (<tr key={i.id}><td className="td font-medium">{i.title}</td><td className="td">{i.climate_targets?.name ?? ""}</td><td className="td">{i.expected_reduction_kgco2e ? kg2t(Number(i.expected_reduction_kgco2e)) : ""}</td><td className="td"><Badge v={i.basis} /></td><td className="td">{i.due_date ?? ""}</td>
        <td className="td">{w ? (<form action={setStatus} className="flex gap-1"><input type="hidden" name="table" value="reduction_initiatives" /><input type="hidden" name="id" value={i.id} /><select name="status" defaultValue={i.status} className="input !w-auto !py-1 text-xs">{["planned", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><button className="btn-outline btn-sm">Set</button></form>) : i.status}</td>
        <td className="td"><DeleteButton table="reduction_initiatives" id={i.id} disabled={!w} /></td></tr>))}</Table>) : <Empty title="No initiatives yet" />}</Panel>
  </>);
}
