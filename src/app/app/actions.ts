"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { canWrite, currentOrg, requireUser } from "@/lib/auth";
import { calculate, type Factor } from "@/lib/emissions";

export type State = { error?: string; ok?: string } | undefined;
const fail = (error: string): State => ({ error });
const done = (ok: string, path?: string): State => { if (path) revalidatePath(path); return { ok }; };
const str = (f: FormData, k: string) => { const v = String(f.get(k) ?? "").trim(); return v === "" ? null : v; };
const num = (f: FormData, k: string) => { const v = str(f, k); return v === null ? null : Number(v); };
const msg = (e: { message: string } | null) => (e ? e.message : null);

async function writer() {
  const c = await currentOrg();
  if (!c.org) throw new Error("Create an organisation first.");
  if (!canWrite(c.org.role)) throw new Error("Your role is read only. Ask an admin for editor access.");
  return { sb: c.sb, user: c.user, org: c.org };
}
function guard<T extends any[]>(fn: (...a: T) => Promise<State>) {
  return async (...a: T): Promise<State> => { try { return await fn(...a); } catch (e: any) { return fail(e?.message ?? "Unexpected error"); } };
}

// ── Organisation ──
export const createOrganisation = guard(async (_: State, f: FormData) => {
  const { sb, user } = await requireUser();
  const name = str(f, "name"); if (!name) return fail("Organisation name is required.");
  const { data: mine } = await sb.from("cb_organisation_members").select("organisation_id").eq("user_id", user.id).eq("role", "owner");
  if ((mine?.length ?? 0) >= 1) {
    const { data: subs } = await sb.from("cb_subscriptions").select("id").eq("status", "active");
    if (!subs?.length) return fail("Your current access includes one organisation. Subscribe to add more.");
  }
  const { data, error } = await sb.from("cb_organisations").insert({
    name, industry: str(f, "industry"), country: str(f, "country"), base_year: num(f, "base_year"),
  }).select("id").single();
  if (error) return fail(error.message);
  (await cookies()).set("cb_org", data.id, { path: "/", sameSite: "lax", maxAge: 31536000 });
  return done("Organisation created.", "/app");
});
export async function selectOrg(f: FormData) {
  const id = String(f.get("org") ?? "");
  if (/^[0-9a-f-]{36}$/.test(id)) (await cookies()).set("cb_org", id, { path: "/", sameSite: "lax", maxAge: 31536000 });
  revalidatePath("/app", "layout");
}
export const updateOrganisation = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  if (!["owner", "admin"].includes(org.role)) return fail("Only owners and admins can edit organisation details.");
  const { error } = await sb.from("cb_organisations").update({
    name: str(f, "name") ?? org.name, industry: str(f, "industry"), country: str(f, "country"),
    boundary_approach: str(f, "boundary_approach") ?? "operational_control", boundary_notes: str(f, "boundary_notes"), base_year: num(f, "base_year"),
  }).eq("id", org.id);
  return msg(error) ? fail(error!.message) : done("Organisation saved.", "/app");
});

const SIMPLE: Record<string, (f: FormData) => Record<string, any> | string> = {
  locations: (f) => (str(f, "name") ? { name: str(f, "name"), country: str(f, "country"), address: str(f, "address") } : "Name is required."),
  departments: (f) => (str(f, "name") ? { name: str(f, "name") } : "Name is required."),
  reporting_periods: (f) => {
    const s = str(f, "start_date"), e = str(f, "end_date"), l = str(f, "label");
    if (!s || !e || !l) return "Label, start and end dates are required.";
    if (e < s) return "End date must be on or after the start date.";
    return { label: l, start_date: s, end_date: e, due_date: str(f, "due_date") };
  },
};
const addSimple = (table: keyof typeof SIMPLE) => guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const row = SIMPLE[table](f); if (typeof row === "string") return fail(row);
  const { error } = await sb.from(`cb_${table}`).insert({ ...row, organisation_id: org.id });
  return msg(error) ? fail(error!.message) : done("Saved.", "/app/organisations");
});
export const addLocation = addSimple("locations");
export const addDepartment = addSimple("departments");
export const addPeriod = addSimple("reporting_periods");

const DELETABLE = ["locations", "departments", "reporting_periods", "emission_factors", "activity_records", "climate_targets",
  "reduction_initiatives", "suppliers", "reports", "documents"];
export async function deleteRow(f: FormData) {
  const table = String(f.get("table")), id = String(f.get("id"));
  if (!DELETABLE.includes(table)) return;
  const { sb } = await writer();
  await sb.from(`cb_${table}`).delete().eq("id", id);
  revalidatePath("/app", "layout");
}

// ── Emission factors ──
export const createFactor = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const p = z.object({
    name: z.string().min(2), category: z.string().min(2), unit: z.string().min(1), source: z.string().min(3, "Source is required"),
    value: z.number().nonnegative(), year: z.number().int().min(1990).max(2100), geography: z.string().min(2),
  }).safeParse({ name: str(f, "name") ?? "", category: str(f, "category") ?? "", unit: str(f, "unit") ?? "", source: str(f, "source") ?? "",
    value: num(f, "kgco2e_per_unit") ?? NaN, year: num(f, "publication_year") ?? NaN, geography: str(f, "geography") ?? "" });
  if (!p.success) return fail(p.error.issues[0].message === "Required" ? "All fields except methodology are required." : p.error.issues[0].message);
  const scope = num(f, "scope");
  const { error } = await sb.from("cb_emission_factors").insert({
    organisation_id: org.id, name: p.data.name, category: p.data.category, scope: scope || null, unit: p.data.unit,
    kgco2e_per_unit: p.data.value, source: p.data.source, publication_year: p.data.year, geography: p.data.geography,
    version: str(f, "version") ?? "1", methodology: str(f, "methodology"),
  });
  return msg(error) ? fail(error!.message) : done("Emission factor saved.", "/app/emission-factors");
});

// ── Activity data + calculation ──
export const createActivity = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const scope = num(f, "scope"), quantity = num(f, "quantity"), unit = str(f, "unit"), factorId = str(f, "factor_id");
  if (![1, 2, 3].includes(scope ?? 0)) return fail("Choose a scope.");
  if (quantity === null || !Number.isFinite(quantity) || quantity < 0) return fail("Enter a valid quantity.");
  if (!unit) return fail("Choose a unit.");
  if (!factorId) return fail("Select an emission factor. Add one on the Emission Factors page if none fit.");
  const { data: factor, error: fe } = await sb.from("cb_emission_factors").select("*").eq("id", factorId).single();
  if (fe || !factor) return fail("Emission factor not found.");
  const calc = calculate(quantity, unit, factor as Factor);
  if (!calc.ok) return fail(calc.error);
  const s3 = scope === 3 ? num(f, "scope3_category") : null;
  if (scope === 3 && !s3) return fail("Choose a Scope 3 category.");
  const { data: act, error } = await sb.from("cb_activity_records").insert({
    organisation_id: org.id, scope, scope3_category: s3, category: factor.category, description: str(f, "description"),
    activity_date: str(f, "activity_date") ?? new Date().toISOString().slice(0, 10), quantity, unit, factor_id: factorId,
    period_id: str(f, "period_id"), location_id: str(f, "location_id"), department_id: str(f, "department_id"), supplier_id: str(f, "supplier_id"),
    data_quality: str(f, "data_quality") ?? "estimated", verification_status: str(f, "verification_status") ?? "unverified",
  }).select("id").single();
  if (error) return fail(error.message);
  const { error: ce } = await sb.from("cb_emissions_calculations").insert({
    organisation_id: org.id, activity_id: act.id, input_quantity: quantity, input_unit: unit, converted_quantity: calc.convertedQuantity,
    factor_unit: factor.unit, factor_value: factor.kgco2e_per_unit, factor_source: factor.source, factor_publication_year: factor.publication_year,
    factor_geography: factor.geography, factor_version: factor.version, methodology: factor.methodology ?? "Activity data x emission factor (GHG Protocol)",
    result_kgco2e: calc.resultKg,
  });
  if (ce) { await sb.from("cb_activity_records").delete().eq("id", act.id); return fail(ce.message); }
  return done(`Recorded: ${(calc.resultKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 4 })} tCO2e`, "/app");
});

// ── Targets and initiatives ──
export const createTarget = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const b = num(f, "baseline_year"), t = num(f, "target_year"), r = num(f, "reduction_percent"), name = str(f, "name");
  if (!name || !b || !t || r === null) return fail("Name, baseline year, target year and reduction percentage are required.");
  if (t <= b) return fail("Target year must be after the baseline year.");
  if (r < 0 || r > 100) return fail("Reduction must be between 0 and 100.");
  const { error } = await sb.from("cb_climate_targets").insert({ organisation_id: org.id, name, target_type: str(f, "target_type") ?? "reduction",
    scope_coverage: str(f, "scope_coverage") ?? "all", baseline_year: b, target_year: t, reduction_percent: r, notes: str(f, "notes") });
  return msg(error) ? fail(error!.message) : done("Target saved.", "/app/targets");
});
export const createInitiative = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const title = str(f, "title"); if (!title) return fail("Title is required.");
  const { error } = await sb.from("cb_reduction_initiatives").insert({ organisation_id: org.id, title, description: str(f, "description"),
    target_id: str(f, "target_id"), expected_reduction_kgco2e: num(f, "expected_tonnes") === null ? null : num(f, "expected_tonnes")! * 1000,
    status: str(f, "status") ?? "planned", due_date: str(f, "due_date"), basis: str(f, "basis") ?? "estimated" });
  return msg(error) ? fail(error!.message) : done("Initiative saved.", "/app/plans");
});
export async function setStatus(f: FormData) {
  const table = String(f.get("table")), id = String(f.get("id")), status = String(f.get("status"));
  if (!["reduction_initiatives", "reports", "suppliers"].includes(table)) return;
  const { sb } = await writer();
  await sb.from(`cb_${table}`).update({ status }).eq("id", id);
  revalidatePath("/app", "layout");
}

// ── Suppliers ──
export const createSupplier = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const name = str(f, "name"); if (!name) return fail("Supplier name is required.");
  const { error } = await sb.from("cb_suppliers").insert({ organisation_id: org.id, name, contact_email: str(f, "contact_email"), country: str(f, "country"), category: str(f, "category") });
  return msg(error) ? fail(error!.message) : done("Supplier added.", "/app/suppliers");
});
export const addSubmission = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const sid = str(f, "supplier_id"), kg = num(f, "reported_tonnes");
  if (!sid) return fail("Choose a supplier.");
  if (kg === null || kg < 0) return fail("Enter reported emissions in tCO2e.");
  const { error } = await sb.from("cb_supplier_submissions").insert({ organisation_id: org.id, supplier_id: sid, reported_kgco2e: kg * 1000,
    methodology: str(f, "methodology"), notes: str(f, "notes"), period_id: str(f, "period_id") });
  if (error) return fail(error.message);
  await sb.from("cb_suppliers").update({ status: "submitted" }).eq("id", sid);
  return done("Submission recorded for review.", "/app/suppliers");
});
export async function reviewSubmission(f: FormData) {
  const { sb, user } = await writer();
  const id = String(f.get("id")), status = String(f.get("status"));
  if (!["approved", "rejected"].includes(status)) return;
  const { data } = await sb.from("cb_supplier_submissions").update({ status, reviewed_by: user.id }).eq("id", id).select("supplier_id").single();
  if (data) await sb.from("cb_suppliers").update({ status: status === "approved" ? "reviewed" : "rejected" }).eq("id", data.supplier_id);
  revalidatePath("/app/suppliers");
}

// ── Reports ──
export const createReport = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const periodId = str(f, "period_id"), title = str(f, "title"), framework = str(f, "framework") ?? "GHG Protocol";
  if (!title) return fail("Title is required.");
  let q = sb.from("cb_activity_records").select("scope, scope3_category, category, activity_date, quantity, unit, data_quality, verification_status, emissions_calculations:cb_emissions_calculations(result_kgco2e, factor_source, factor_value, factor_unit, methodology)").eq("organisation_id", org.id);
  let period: any = null;
  if (periodId) { const r = await sb.from("cb_reporting_periods").select("*").eq("id", periodId).single(); period = r.data; if (period) q = q.eq("period_id", periodId); }
  const { data: acts, error } = await q; if (error) return fail(error.message);
  const rows = (acts ?? []).map((a: any) => ({ ...a, kg: Number(a.emissions_calculations?.result_kgco2e ?? a.emissions_calculations?.[0]?.result_kgco2e ?? 0), calc: Array.isArray(a.emissions_calculations) ? a.emissions_calculations[0] : a.emissions_calculations }));
  const byScope = [1, 2, 3].map((s) => rows.filter((r) => r.scope === s).reduce((t, r) => t + r.kg, 0));
  const cat: Record<string, number> = {}; rows.forEach((r) => { cat[r.category] = (cat[r.category] ?? 0) + r.kg; });
  const sources = Array.from(new Set(rows.map((r) => r.calc?.factor_source).filter(Boolean)));
  const methods = Array.from(new Set(rows.map((r) => r.calc?.methodology).filter(Boolean)));
  const unverified = rows.filter((r) => r.verification_status === "unverified").length;
  const estimated = rows.filter((r) => r.data_quality === "estimated" || r.data_quality === "assumed").length;
  const [{ data: targets }, { data: inits }] = await Promise.all([
    sb.from("cb_climate_targets").select("*").eq("organisation_id", org.id), sb.from("cb_reduction_initiatives").select("title,status,expected_reduction_kgco2e,basis").eq("organisation_id", org.id)]);
  const snapshot = { organisation: { name: org.name, industry: org.industry, country: org.country, boundary: org.boundary_approach, base_year: org.base_year },
    period: period ? { label: period.label, start: period.start_date, end: period.end_date } : { label: "All recorded data" },
    totals_kgco2e: { total: byScope.reduce((a, b) => a + b, 0), scope1: byScope[0], scope2: byScope[1], scope3: byScope[2] },
    by_category_kgco2e: cat, record_count: rows.length, unverified_records: unverified, estimated_or_assumed_records: estimated,
    data_sources: sources, methodologies: methods, targets: targets ?? [], initiatives: inits ?? [], generated_at: new Date().toISOString(), framework,
    framework_note: "This report structure is aligned to the named framework. It is not a statement of regulatory compliance." };
  const { error: ie } = await sb.from("cb_reports").insert({ organisation_id: org.id, period_id: periodId, title, framework, snapshot });
  return msg(ie) ? fail(ie!.message) : done("Report generated.", "/app/reports");
});

// ── Team, profile, notifications ──
export const addMember = guard(async (_: State, f: FormData) => {
  const { sb, org } = await writer();
  const email = str(f, "email"); if (!email) return fail("Email is required.");
  const { data, error } = await sb.rpc("cb_add_member_by_email", { org: org.id, member_email: email, member_role: str(f, "role") ?? "viewer" });
  if (error) return fail(error.message);
  return data === "ok" ? done("Member added.", "/app/team") : fail(String(data));
});
export async function removeMember(f: FormData) {
  const { sb, org } = await writer();
  await sb.from("cb_organisation_members").delete().eq("organisation_id", org.id).eq("user_id", String(f.get("user_id"))).neq("role", "owner");
  revalidatePath("/app/team");
}
export const updateProfile = guard(async (_: State, f: FormData) => {
  const { sb, user } = await requireUser();
  const { error } = await sb.from("cb_profiles").update({ full_name: str(f, "full_name"), job_title: str(f, "job_title"), updated_at: new Date().toISOString() }).eq("id", user.id);
  return msg(error) ? fail(error!.message) : done("Profile saved.", "/app/settings");
});
export async function markAllRead() {
  const { sb, user } = await requireUser();
  await sb.from("cb_notifications").update({ is_read: true }).eq("user_id", user.id);
  revalidatePath("/app", "layout");
}
export async function recordDocument(orgId: string, name: string, path: string, size: number, mime: string) {
  const { sb } = await requireUser();
  const { error } = await sb.from("cb_documents").insert({ organisation_id: orgId, name, storage_path: path, size_bytes: size, mime_type: mime });
  revalidatePath("/app/documents"); return error?.message ?? null;
}
