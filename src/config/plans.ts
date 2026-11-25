// Prices and billing frequency were read from the live Selar checkout pages (og:description).
// Plan names, feature lists and usage limits are NOT published on Selar (all three pages are titled "Subscription").
// Fill `name`, `features` and `limits` below once the business owner confirms them. Nothing here is invented.
export type Plan = { key: "plan_1" | "plan_2" | "plan_3"; name: string; price: string; frequency: string; url: string; features: string[]; limits: string[] };
export const PLANS: Plan[] = [
  { key: "plan_1", name: "Plan 1", price: "$47", frequency: "per month", url: "https://selar.com/47plan?currency=USD", features: [], limits: [] },
  { key: "plan_2", name: "Plan 2", price: "$57", frequency: "per month", url: "https://selar.com/57plan?currency=USD", features: [], limits: [] },
  { key: "plan_3", name: "Plan 3", price: "$97", frequency: "per month", url: "https://selar.com/97plan?currency=USD", features: [], limits: [] },
];
// Included with every paid plan (true of the product itself, not a limit claim).
export const CORE_FEATURES = [
  "Scope 1, 2 and 3 activity tracking", "Transparent emissions calculation with audit trail", "Emission factor library with sources",
  "Climate targets and reduction plans", "Supplier data requests", "AI Climate Assistant grounded in your data", "CSV and PDF report exports",
];
