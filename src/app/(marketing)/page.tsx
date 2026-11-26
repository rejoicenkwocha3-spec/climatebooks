import Link from "next/link";
import { ArrowRight, Calculator, Layers, BarChart3, FileText, Sparkles, Target, Users, Gauge } from "lucide-react";
import { CtaBand, FeatureCard, SectionTitle } from "@/components/Marketing";
import { PLANS } from "@/config/plans";

export default function Home() {
  return (
    <>
      <section className="bg-emerald text-white">
        <div className="container-x py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Climate accounting platform</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">Climate Intelligence. Measurable Impact.</h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">ClimateBooks helps businesses measure their carbon footprint, manage sustainability data and create meaningful climate reports with intelligent AI powered tools.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-gold">Get Started <ArrowRight size={16} /></Link>
              <Link href="/login" className="btn bg-white/10 text-white hover:bg-white/20">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section"><div className="container-x">
        <SectionTitle eyebrow="The future of climate accounting" title="One place for your climate data, calculations and reports" copy="Replace scattered spreadsheets with a single system where every number can be traced back to its source." />
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard icon={Gauge} title="Measurement" copy="Understand your organisation's environmental footprint across operations and the value chain." />
          <FeatureCard icon={Sparkles} title="Intelligence" copy="Turn complex climate data into clear insights with an assistant grounded in your own records." />
          <FeatureCard icon={FileText} title="Accountability" copy="Track environmental performance and produce sustainability reports with a full audit trail." />
        </div>
      </div></section>

      <section className="section bg-white"><div className="container-x">
        <SectionTitle eyebrow="Scope 1, 2 and 3" title="Measure your carbon footprint" copy="Emissions equal activity data multiplied by an emission factor. ClimateBooks records both, the unit conversion, the factor source and the result, so you can always show your working." />
        <div className="grid gap-5 md:grid-cols-3">
          {[["Scope 1", "Direct emissions from owned or controlled sources: company vehicles, fuel combustion, refrigerants and equipment."],
            ["Scope 2", "Indirect emissions from purchased energy: electricity, heating, cooling and steam."],
            ["Scope 3", "Value chain emissions across the 15 recognised categories, from purchased goods to investments."]].map(([t, c]) => (
            <div key={t} className="card p-6"><h3 className="text-xl font-bold">{t}</h3><p className="mt-2 text-sm text-charcoal/75">{c}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section"><div className="container-x">
        <SectionTitle eyebrow="Capabilities" title="From data collection to decarbonisation" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Calculator} title="Intelligent sustainability reporting" copy="Generate reports with methodologies, data sources and breakdowns, and export to PDF or CSV." />
          <FeatureCard icon={Sparkles} title="AI powered climate insights" copy="Ask which activities drive your emissions and get answers drawn from your actual data." />
          <FeatureCard icon={BarChart3} title="Emissions analytics" copy="Explore emissions by scope, category, location and period with clear charts." />
          <FeatureCard icon={Target} title="Decarbonisation planning" copy="Set baseline and target years, track initiatives and compare progress with your goal." />
          <FeatureCard icon={Users} title="Supplier engagement" copy="Invite suppliers, request data and review submissions in one workflow." />
          <FeatureCard icon={Layers} title="Industry solutions" copy="Configured for SMEs, enterprises, manufacturers, property, finance and consultants." />
        </div>
        <div className="mt-8"><Link href="/solutions" className="btn-outline">See industry solutions</Link></div>
      </div></section>

      <section className="section bg-white"><div className="container-x">
        <SectionTitle eyebrow="Pricing" title="Simple monthly plans" />
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.key} className="card p-6"><p className="text-sm font-semibold text-charcoal/70">{p.name}</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-emerald">{p.price}<span className="text-base font-medium text-charcoal/60"> {p.frequency}</span></p></div>
          ))}
        </div>
        <div className="mt-8"><Link href="/pricing" className="btn-primary">Compare plans</Link></div>
      </div></section>
      <CtaBand />
    </>
  );
}
