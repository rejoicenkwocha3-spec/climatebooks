import { ActionForm, Field, Select } from "@/components/ui";
import { Badge, NoOrg, PageHeader, Panel, Table } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { addMember, removeMember } from "../actions";
export const metadata = { title: "Team" };
export default async function Team() {
  const { sb, org, user } = await currentOrg(); if (!org) return <NoOrg />;
  const admin = ["owner", "admin"].includes(org.role);
  const { data } = await sb.from("cb_organisation_members").select("user_id, role, profiles:cb_profiles(full_name,email)").eq("organisation_id", org.id);
  return (<><PageHeader title="Team" copy="Owners and admins manage access. Editors can change data. Viewers have read only access." />
    {admin && <Panel title="Add a member" className="mb-6"><ActionForm action={addMember} submit="Add member"><Field label="Email of an existing ClimateBooks user" name="email" type="email" required />
      <Select label="Role" name="role" required defaultValue="viewer" options={[{ value: "admin", label: "Admin" }, { value: "editor", label: "Editor" }, { value: "viewer", label: "Viewer" }]} /></ActionForm></Panel>}
    <Panel><Table head={["Name", "Email", "Role", ""]}>{(data ?? []).map((m: any) => { const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles; return (<tr key={m.user_id}><td className="td">{p?.full_name || "Unnamed"}{m.user_id === user.id && " (you)"}</td><td className="td">{p?.email}</td><td className="td"><Badge v={m.role} /></td>
      <td className="td">{admin && m.role !== "owner" && <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="text-xs font-semibold text-red-700 hover:underline">Remove</button></form>}</td></tr>); })}</Table></Panel></>);
}
