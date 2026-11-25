import Link from "next/link";
import { Inbox } from "lucide-react";
import { deleteRow } from "@/app/app/actions";

export function PageHeader({ title, copy, children }: { title: string; copy?: string; children?: React.ReactNode }) {
  return (<div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{copy && <p className="mt-1 max-w-2xl text-sm text-charcoal/70">{copy}</p>}</div>{children}</div>);
}
export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (<section className={`card p-5 ${className}`}>{title && <h2 className="mb-4 text-base font-bold">{title}</h2>}{children}</section>);
}
export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (<div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">{label}</p><p className="mt-1 font-display text-2xl font-extrabold text-emerald">{value}</p>{sub && <p className="mt-0.5 text-xs text-charcoal/60">{sub}</p>}</div>);
}
export function Empty({ title, copy, action }: { title: string; copy?: string; action?: React.ReactNode }) {
  return (<div className="flex flex-col items-center rounded-xl border border-dashed border-forest/25 bg-white/60 px-6 py-10 text-center"><Inbox className="text-sage" /><p className="mt-3 font-semibold text-emerald">{title}</p>{copy && <p className="mt-1 max-w-md text-sm text-charcoal/65">{copy}</p>}{action && <div className="mt-4">{action}</div>}</div>);
}
export function NoOrg() {
  return (<Empty title="Create your first organisation" copy="ClimateBooks keeps all data inside an organisation. Create one to begin recording activity data." action={<Link href="/app/organisations" className="btn-primary">Create organisation</Link>} />);
}
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (<div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-forest/10"><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead><tbody className="divide-y divide-forest/5">{children}</tbody></table></div>);
}
export function DeleteButton({ table, id, disabled }: { table: string; id: string; disabled?: boolean }) {
  if (disabled) return null;
  return (<form action={deleteRow}><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={id} /><button className="text-xs font-semibold text-red-700 hover:underline">Delete</button></form>);
}
const tone: Record<string, string> = {
  measured: "bg-forest/10 text-forest", calculated: "bg-sage/30 text-emerald", estimated: "bg-gold/25 text-emerald", assumed: "bg-red-100 text-red-800",
  unverified: "bg-gold/25 text-emerald", internally_reviewed: "bg-sage/30 text-emerald", third_party_verified: "bg-forest/10 text-forest",
};
export function Badge({ v }: { v: string }) { return <span className={`badge ${tone[v] ?? "bg-charcoal/10 text-charcoal"}`}>{v.replace(/_/g, " ")}</span>; }
export const kg2t = (kg: number) => (kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
