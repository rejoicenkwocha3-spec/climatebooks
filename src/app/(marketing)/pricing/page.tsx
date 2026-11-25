import { Check } from "lucide-react";
import { CtaBand, PageHero } from "@/components/Marketing";
import { CORE_FEATURES, PLANS } from "@/config/plans";
export const metadata = { title: "Pricing" };
export default function Pricing() {
  return (<>
    <PageHero eyebrow="Pricing" title="Choose a plan" copy="Checkout is handled securely by Selar. Paid access is activated only after payment is verified, never from a button click.">
      <></>
    </PageHero>
    <section className="section"><div className="container-x">
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <div key={p.key} className={`card flex flex-col p-7 ${i === 1 ? "ring-2 ring-gold" : ""}`}>
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-4 font-display text-5xl font-extrabold text-emerald">{p.price}</p>
            <p className="text-sm text-charcoal/60">{p.frequency}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {[...CORE_FEATURES, ...p.features].map((f) => (<li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-forest" />{f}</li>))}
              {p.limits.map((l) => (<li key={l} className="flex gap-2 text-charcoal/70"><Check size={16} className="mt-0.5 shrink-0 text-sage" />{l}</li>))}
            </ul>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7">Subscribe to {p.name}</a>
          </div>))}
      </div>
      <p className="mt-6 text-center text-sm text-charcoal/60">Use the same email address at checkout as your ClimateBooks account so your subscription can be matched.</p>
    </div></section>
    <CtaBand />
  </>);
}
