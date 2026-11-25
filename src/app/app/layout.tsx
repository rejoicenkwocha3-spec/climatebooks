import { Sidebar } from "@/components/Sidebar";
import { currentOrg } from "@/lib/auth";
import { selectOrg } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, org, orgs } = await currentOrg();
  const { count } = await sb.from("cbk_notifications").select("id", { count: "exact", head: true }).eq("is_read", false).eq("user_id", user.id);
  return (
    <div className="flex min-h-screen">
      <Sidebar unread={count ?? 0} />
      <div className="min-w-0 flex-1 pt-14 lg:pt-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/10 bg-white px-4 py-3 sm:px-8">
          <form action={selectOrg} className="flex items-center gap-2">
            <label htmlFor="org" className="text-xs font-semibold uppercase text-charcoal/60">Organisation</label>
            {orgs.length ? (<><select id="org" name="org" defaultValue={org?.id} className="input !w-auto min-w-[10rem]">{orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              <button className="btn-outline btn-sm">Switch</button></>) : <span className="text-sm text-charcoal/60">None yet</span>}
          </form>
          <p className="text-sm text-charcoal/70">{user.email}{org ? ` · ${org.role}` : ""}</p>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
