import { Badge, PageHeader, Panel } from "@/components/app";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
export const metadata = { title: "Billing" };
export default async function Billing() {
  const { sb } = await requireUser();
  const { data: subs } = await sb.from("subscriptions").select("*").order("created_at", { ascending: false });
  const active = subs?.find((s: any) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end) > new Date()));
  const plan = PLANS.find((p) => p.key === active?.plan_key);
  return (<><PageHeader title="Billing" copy="Subscriptions are activated only when Selar confirms payment to ClimateBooks. Clicking a checkout button never grants access." />
    <Panel title="Current subscription">{active ? (<div className="text-sm"><p className="text-lg font-bold text-emerald">{plan?.name} <Badge v="measured" /></p><p className="mt-1">{plan?.price} {plan?.frequency}. {active.current_period_end ? `Renews or ends ${active.current_period_end.slice(0, 10)}.` : ""}</p></div>) : <p className="text-sm">No active subscription. You can use one organisation without a subscription.</p>}</Panel>
    <div className="mt-6 grid gap-4 md:grid-cols-3">{PLANS.map((p) => (<div key={p.key} className="card p-5"><p className="font-bold">{p.name}</p><p className="font-display text-3xl font-extrabold text-emerald">{p.price}<span className="text-sm font-medium text-charcoal/60"> {p.frequency}</span></p>
      <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full">{active?.plan_key === p.key ? "Renew" : "Subscribe"}</a></div>))}</div>
    <p className="mt-4 text-xs text-charcoal/60">Use the same email address at checkout as your ClimateBooks account.</p></>);
}
