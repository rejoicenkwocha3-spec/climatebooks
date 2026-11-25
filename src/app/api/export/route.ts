import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { apiUser, currentOrg } from "@/lib/auth";
import { loadActivity } from "@/lib/data";

const csvCell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n");
const t = (kg: number) => (kg / 1000).toFixed(3);

export async function GET(req: NextRequest) {
  if (!(await apiUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sb, org } = await currentOrg();
  if (!org) return NextResponse.json({ error: "No organisation" }, { status: 400 });
  const p = req.nextUrl.searchParams; const kind = p.get("kind");
  if (kind === "activity") {
    const rows = await loadActivity(sb, org.id);
    const body = csv([["date", "scope", "scope3_category", "category", "description", "quantity", "unit", "factor_value", "factor_unit", "factor_source", "tCO2e", "data_quality", "verification", "location", "department", "supplier", "period"],
      ...rows.map((r) => [r.activity_date, r.scope, r.scope3_category, r.category, r.description, r.quantity, r.unit, r.factor_value, r.factor_unit, r.factor_source, t(r.kg), r.data_quality, r.verification_status, r.location, r.department, r.supplier, r.period])]);
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="activity-data.csv"' } });
  }
  if (kind === "report") {
    const { data: rep } = await sb.from("reports").select("*").eq("id", p.get("id") ?? "").eq("organisation_id", org.id).single();
    if (!rep) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    const s = rep.snapshot as any; const T = s.totals_kgco2e;
    if (p.get("format") === "pdf") {
      const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      let page = pdf.addPage([595, 842]); let y = 800;
      const line = (text: string, o: { b?: boolean; size?: number; color?: [number, number, number] } = {}) => {
        const size = o.size ?? 10; const f = o.b ? bold : font; const max = 85;
        const words = text.split(" "); let cur = "";
        const flush = () => { if (y < 60) { page = pdf.addPage([595, 842]); y = 800; } page.drawText(cur, { x: 50, y, size, font: f, color: rgb(...(o.color ?? [0.14, 0.17, 0.15])) }); y -= size + 5; cur = ""; };
        for (const w of words) { if ((cur + " " + w).length > max) flush(); cur = cur ? cur + " " + w : w; } if (cur) flush();
      };
      const g: [number, number, number] = [0.09, 0.3, 0.21];
      line(rep.title, { b: true, size: 20, color: g }); line(`${s.organisation.name} | ${s.period.label} | ${rep.framework} | Status: ${rep.status}`); y -= 8;
      line("Total emissions", { b: true, size: 13, color: g });
      line(`Total: ${t(T.total)} tCO2e   Scope 1: ${t(T.scope1)}   Scope 2: ${t(T.scope2)}   Scope 3: ${t(T.scope3)}`);
      line(`Records: ${s.record_count}. Estimated or assumed: ${s.estimated_or_assumed_records}. Unverified: ${s.unverified_records}.`); y -= 8;
      line("Emissions by category (tCO2e)", { b: true, size: 13, color: g });
      Object.entries(s.by_category_kgco2e as Record<string, number>).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => line(`${k}: ${t(v)}`)); y -= 8;
      line("Organisational boundary", { b: true, size: 13, color: g }); line(`Consolidation approach: ${String(s.organisation.boundary).replace(/_/g, " ")}. Base year: ${s.organisation.base_year ?? "not set"}.`); y -= 8;
      line("Methodologies", { b: true, size: 13, color: g }); (s.methodologies.length ? s.methodologies : ["None recorded"]).forEach((m: string) => line(m)); y -= 8;
      line("Data sources (emission factors)", { b: true, size: 13, color: g }); (s.data_sources.length ? s.data_sources : ["None recorded"]).forEach((m: string) => line(m)); y -= 8;
      line("Reduction targets", { b: true, size: 13, color: g }); (s.targets.length ? s.targets : []).forEach((x: any) => line(`${x.name}: ${x.reduction_percent}% by ${x.target_year} from ${x.baseline_year} (${x.target_type === "net_zero" ? "net zero commitment, not an achievement" : "reduction target"})`));
      if (!s.targets.length) line("No targets set."); y -= 8;
      line("Sustainability initiatives", { b: true, size: 13, color: g }); (s.initiatives.length ? s.initiatives : []).forEach((x: any) => line(`${x.title} (${x.status}, ${x.basis} basis${x.expected_reduction_kgco2e ? `, expected ${t(x.expected_reduction_kgco2e)} tCO2e` : ""})`));
      if (!s.initiatives.length) line("None recorded."); y -= 10;
      line(s.framework_note, { size: 8 }); line(`Generated ${s.generated_at}`, { size: 8 });
      return new NextResponse(Buffer.from(await pdf.save()), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="climatebooks-report.pdf"` } });
    }
    const body = csv([["section", "item", "value"], ["organisation", "name", s.organisation.name], ["period", "label", s.period.label], ["framework", "name", rep.framework],
      ["totals tCO2e", "total", t(T.total)], ["totals tCO2e", "scope1", t(T.scope1)], ["totals tCO2e", "scope2", t(T.scope2)], ["totals tCO2e", "scope3", t(T.scope3)],
      ...Object.entries(s.by_category_kgco2e as Record<string, number>).map(([k, v]) => ["category tCO2e", k, t(v)]),
      ...s.methodologies.map((m: string) => ["methodology", "", m]), ...s.data_sources.map((m: string) => ["data source", "", m]),
      ...s.targets.map((x: any) => ["target", x.name, `${x.reduction_percent}% by ${x.target_year} from ${x.baseline_year}`]), ...s.initiatives.map((x: any) => ["initiative", x.title, `${x.status} (${x.basis})`])]);
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="climatebooks-report.csv"' } });
  }
  return NextResponse.json({ error: "Unknown export" }, { status: 400 });
}
