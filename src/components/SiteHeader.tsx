"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { href: "/", label: "Home" }, { href: "/platform", label: "Platform" }, { href: "/solutions", label: "Solutions" },
  { href: "/features", label: "Features" }, { href: "/pricing", label: "Pricing" },
];
export function SiteHeader() {
  const path = usePathname(); const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-offwhite/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${path === l.href ? "bg-forest/10 text-forest" : "text-charcoal/80 hover:text-forest"}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-outline btn-sm">Log in</Link>
          <Link href="/signup" className="btn-primary btn-sm">Get Started</Link>
        </div>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-forest/10 bg-white md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-forest/5">{l.label}</Link>)}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="btn-outline btn-sm flex-1">Log in</Link>
              <Link href="/signup" className="btn-primary btn-sm flex-1">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
