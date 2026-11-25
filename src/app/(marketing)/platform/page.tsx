import { ChevronRight, Calculator, Ruler, Database, FileText, Sparkles, BarChart3, Target, Users, ShieldAlert, ClipboardCheck } from "lucide-react";
import { CtaBand, FeatureCard, PageHero, SectionTitle } from "@/components/Marketing";
export const metadata = { title: "Platform" };
const modules = [
  [Calculator, "Carbon Accounting", "A structured ledger of activity data, factors and results across all three scopes."],
  [Ruler, "Emissions Measurement", "Calculate with unit conversion and keep the quantity, factor and methodology on every record."],
  [Database, "Climate Data Management", "Locations, departments, reporting periods and organisational boundaries in one model."],
  [FileText, "Sustainability Reporting", "Report snapshots with methodologies, data sources and exports to PDF and CSV."],
  [Sparkles, "AI Climate Intelligence", "An assistant that answers from your records and says so when data is missing."],
  [BarChart3, "Emissions Analytics", "Breakdowns by scope, category, location and time."],
  [Target, "Decarbonisation Management", "Targets, initiatives and progress against your baseline year."],
  [Users, "Supplier Engagement", "Invitations, data requests, submissions and review."],
  [ShieldAlert, "Climate Risk Management", "Physical and transition risks, with measured and modelled information kept apart."],
  [ClipboardCheck, "Audit and Assurance", "Every change to calculations is logged so reviewers can follow the trail."],
] as const;
const steps = ["Collect Data", "Calculate Emissions", "Analyse Impact", "Generate Reports", "Plan Reductions", "Monitor Progress"];
export default function Platform() {
  return (<>
    <PageHero eyebrow="Platform" title="Manage the entire climate accounting process" copy="ClimateBooks connects data collection, calculation, analysis, reporting and reduction planning in one secure workspace." />
    <section className="section"><div className="container-x">
      <SectionTitle eyebrow="Workflow" title="How ClimateBooks works" />
      <ol className="grid gap-3 md:grid-cols-6">
        {steps.map((s, i) => (
          <li key={s} className="card relative p-4 text-center">
            <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
            <span className="text-sm font-semibold text-emerald">{s}</span>
            {i < steps.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-sage md:block" size={20} />}
          </li>))}
      </ol>
    </div></section>
    <section className="section bg-white"><div className="container-x">
      <SectionTitle eyebrow="Modules" title="Everything your climate team needs" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{modules.map(([I, t, c]) => <FeatureCard key={t} icon={I} title={t} copy={c} />)}</div>
    </div></section>
    <CtaBand />
  </>);
}
