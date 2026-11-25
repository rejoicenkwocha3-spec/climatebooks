import { Empty, PageHeader, Panel } from "@/components/app";
import { currentOrg } from "@/lib/auth";
import { markAllRead } from "../actions";
export const metadata = { title: "Notifications" };
export default async function Notifications() {
  const { sb, user } = await currentOrg();
  const { data } = await sb.from("cb_notifications").select("*").or(`user_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50);
  return (<><PageHeader title="Notifications"><form action={markAllRead}><button className="btn-outline btn-sm">Mark all read</button></form></PageHeader>
    <Panel>{data?.length ? <ul className="divide-y divide-forest/10">{data.map((n: any) => (<li key={n.id} className="py-3"><p className={`text-sm ${n.is_read ? "" : "font-bold"}`}>{n.title}</p>{n.body && <p className="text-sm text-charcoal/70">{n.body}</p>}<p className="text-xs text-charcoal/50">{n.created_at.slice(0, 16).replace("T", " ")}</p></li>))}</ul> : <Empty title="No notifications" />}</Panel></>);
}
