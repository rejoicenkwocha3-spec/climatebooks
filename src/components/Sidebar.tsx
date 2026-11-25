"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, BookOpen, Building2, Calculator, CreditCard, FileText, Flame, FolderOpen, Gauge, Leaf, Menu, Plug, Settings, Sparkles, Target, Truck, Users, Wind, X, BarChart3, ListChecks, Database, Factory, LogOut } from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  ["/app", "Overview", Gauge], ["/app/organisations", "Organisations", Building2], ["/app/carbon-footprint", "Carbon Footprint", Leaf],
  ["/app/scope-1", "Scope 1 Emissions", Flame], ["/app/scope-2", "Scope 2 Emissions", Plug], ["/app/scope-3", "Scope 3 Emissions", Wind],
  ["/app/activity", "Activity Data", Calculator], ["/app/emission-factors", "Emission Factors", Database], ["/app/analytics", "Analytics", BarChart3],
  ["/app/reports", "Reports", FileText], ["/app/targets", "Climate Targets", Target], ["/app/plans", "Reduction Plans", ListChecks],
  ["/app/suppliers", "Suppliers", Truck], ["/app/assistant", "AI Assistant", Sparkles], ["/app/documents", "Documents", FolderOpen],
  ["/app/team", "Team", Users], ["/app/notifications", "Notifications", Bell], ["/app/billing", "Billing", CreditCard], ["/app/settings", "Settings", Settings],
] as const;

export function Sidebar({ unread }: { unread: number }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  const list = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Application">
      {nav.map(([href, label, Icon]) => {
        const active = href === "/app" ? path === "/app" : path.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-gold text-emerald" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={17} /><span className="flex-1">{label}</span>
            {label === "Notifications" && unread > 0 && <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold text-emerald">{unread}</span>}
          </Link>);
      })}
      <form action="/auth/signout" method="post"><button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"><LogOut size={17} />Log out</button></form>
    </nav>
  );
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-emerald px-4 lg:hidden">
        <Logo href="/app" light />
        <button aria-label="Toggle navigation" className="text-white" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-emerald pt-14 transition-transform lg:static lg:translate-x-0 lg:pt-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="hidden h-16 items-center px-5 lg:flex"><Logo href="/app" light /></div>
        {list}
      </aside>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-10 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
