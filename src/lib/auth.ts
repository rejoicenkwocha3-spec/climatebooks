import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "./supabase/server";

export async function requireUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return { sb, user };
}
/** Current organisation = cookie choice if the user is a member, otherwise first membership. */
export async function currentOrg() {
  const { sb, user } = await requireUser();
  const { data: memberships } = await sb.from("cb_organisation_members")
    .select("role, organisations:cb_organisations(id,name,industry,country,boundary_approach,boundary_notes,base_year)").eq("user_id", user.id);
  const list = (memberships ?? []).map((m: any) => ({ ...m.organisations, role: m.role })).filter((o: any) => o.id);
  const chosen = (await cookies()).get("cb_org")?.value;
  const org = list.find((o: any) => o.id === chosen) ?? list[0] ?? null;
  return { sb, user, org, orgs: list as any[] };
}
export const canWrite = (role?: string) => role === "owner" || role === "admin" || role === "editor";

/** For API routes: JSON 401 instead of a redirect. */
export async function apiUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
