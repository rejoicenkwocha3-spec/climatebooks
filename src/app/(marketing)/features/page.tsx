import { CtaBand, PageHero, SectionTitle } from "@/components/Marketing";
import { SCOPE3_CATEGORIES } from "@/lib/emissions";
export const metadata = { title: "Features" };
const blocks = [
  ["Carbon Footprint Measurement", "Measure greenhouse gas emissions across your operations and value chains."],
  ["Scope 1 Emissions", "Direct emissions from owned and controlled sources: company vehicles, fuel combustion, industrial processes, refrigerants and company equipment."],
  ["Scope 2 Emissions", "Indirect emissions from purchased energy: electricity, heating, cooling and steam."],
  ["Emissions Analytics", "Visualise emissions by scope, business location, department, supplier and emission category."],
  ["Climate Reporting", "Report structures aligned to GHG Protocol, CDP, CSRD, ESRS, ISSB and SECR. Framework specific outputs are offered only where your data and the methodology support them, and ClimateBooks never states regulatory compliance on your behalf."],
  ["AI Climate Assistant", "Ask about your total footprint, hotspots, year on year change and Scope 3 sources, then generate a performance summary. Answers use your actual data and say when data is missing."],
  ["Decarbonisation Planning", "Set reduction targets, create action plans, track initiatives, compare baseline with current performance and review scenarios."],
  ["Supplier Management", "Send supplier invitations, request data, collect submissions and review them."],
  ["Climate Risk", "Track physical and transition risks, clearly marking what is measured and what is estimated or modelled."],
];
export default function Features() {
  return (<>
    <PageHero eyebrow="Features" title="Transparent climate accounting, feature by feature" copy="Every capability is built around traceable data, recognised methodology and honest reporting." />
    <section className="section"><div className="container-x">
      <div className="grid gap-5 md:grid-cols-2">
        {blocks.map(([t, c]) => (<div key={t} className="card p-6"><h3 className="text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-charcoal/75">{c}</p></div>))}
      </div>
    </div></section>
    <section className="section bg-white"><div className="container-x">
      <SectionTitle eyebrow="Scope 3" title="The 15 recognised Scope 3 categories" copy="Upstream: categories 1 to 8. Downstream: categories 9 to 15." />
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCOPE3_CATEGORIES.map((c, i) => (<li key={c} className="flex items-center gap-3 rounded-lg border border-forest/10 px-4 py-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest">{i + 1}</span>{c}</li>))}
      </ol>
    </div></section>
    <CtaBand />
  </>);
}
