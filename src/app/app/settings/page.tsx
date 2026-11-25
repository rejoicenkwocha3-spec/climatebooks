import Link from "next/link";
import { ActionForm, Field } from "@/components/ui";
import { PageHeader, Panel } from "@/components/app";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "../actions";
export const metadata = { title: "Settings" };
export default async function Settings() {
  const { sb, user } = await requireUser();
  const { data: p } = await sb.from("cbk_profiles").select("*").eq("id", user.id).single();
  return (<><PageHeader title="Settings" />
    <Panel title="Profile"><ActionForm action={updateProfile} submit="Save profile"><Field label="Full name" name="full_name" defaultValue={p?.full_name ?? ""} /><Field label="Job title" name="job_title" defaultValue={p?.job_title ?? ""} />
      <Field label="Email" name="email"><input className="input" value={user.email ?? ""} disabled readOnly /></Field></ActionForm></Panel>
    <Panel title="Password" className="mt-6"><p className="text-sm text-charcoal/70">To change your password, request a reset link.</p><Link href="/forgot-password" className="btn-outline mt-3">Send reset link</Link></Panel></>);
}
