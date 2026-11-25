import Link from "next/link";
import { CtaBand, PageHero, SectionTitle } from "@/components/Marketing";
export const metadata = { title: "Solutions" };
const items = [
  ["Small and Medium Businesses", "Limited time and no dedicated sustainability staff.", "Guided activity entry, ready calculations and a simple report your customers and lenders can read."],
  ["Large Enterprises", "Many sites, departments and data owners.", "Organisational boundaries, role based access, reporting periods and an audit trail across the group."],
  ["Financial Institutions", "Portfolio and financed emissions are hard to evidence.", "Scope 3 category 15 records with data quality flags that separate measured from estimated figures."],
  ["Manufacturing Companies", "Process fuels, refrigerants and energy intensive operations.", "Scope 1 and 2 tracking by location with factor sources recorded for every calculation."],
  ["Real Estate and Property", "Tenant and landlord energy across a portfolio of buildings.", "Locations as buildings, leased asset categories and year on year comparison."],
  ["Supply Chain Businesses", "Customers ask for supplier data you do not yet hold.", "Supplier invitations, data requests and a review workflow for submissions."],
  ["Sustainability Consultants", "Managing several clients with repeatable methods.", "Multiple organisations, versioned custom factors and exportable report snapshots."],
  ["ESG Teams", "Disclosure deadlines and scattered evidence.", "Reporting periods with due dates, documents storage and framework aligned report structure."],
];
export default function Solutions() {
  return (<>
    <PageHero eyebrow="Solutions" title="Built for the way your organisation works" copy="Each team faces different climate accounting problems. See how ClimateBooks addresses them." />
    <section className="section"><div className="container-x">
      <SectionTitle title="Solutions by audience" />
      <div className="grid gap-5 md:grid-cols-2">
        {items.map(([t, p, s]) => (
          <div key={t} className="card flex flex-col p-6">
            <h3 className="text-xl font-bold">{t}</h3>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-forest">The problem</p><p className="mt-1 text-sm text-charcoal/80">{p}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-forest">How ClimateBooks helps</p><p className="mt-1 text-sm text-charcoal/80">{s}</p>
            <div className="mt-5"><Link href="/signup" className="btn-primary btn-sm">Get Started</Link></div>
          </div>))}
      </div>
    </div></section>
    <CtaBand />
  </>);
}
