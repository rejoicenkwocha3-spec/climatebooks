import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PageHero({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children?: React.ReactNode }) {
  return (
    <section className="bg-emerald text-white">
      <div className="container-x py-16 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-white/80">{copy}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {children ?? (<><Link href="/signup" className="btn-gold">Get Started</Link><Link href="/features" className="btn bg-white/10 text-white hover:bg-white/20">Explore Features</Link></>)}
        </div>
      </div>
    </section>
  );
}
export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-forest">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {copy && <p className="mt-4 text-charcoal/75">{copy}</p>}
    </div>
  );
}
export function FeatureCard({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10 text-forest"><Icon size={20} /></div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{copy}</p>
    </div>
  );
}
export function CtaBand() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="rounded-2xl bg-forest px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Measure Impact. Manage Carbon. Build a Better Future.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">Create your ClimateBooks workspace and start recording activity data today.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn-gold">Get Started <ArrowRight size={16} /></Link>
            <Link href="/pricing" className="btn bg-white/10 text-white hover:bg-white/20">View Pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
