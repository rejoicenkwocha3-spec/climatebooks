import { convert } from "./units";
export type Factor = {
  id: string; name: string; unit: string; kgco2e_per_unit: number; source: string;
  publication_year: number; geography: string; version: string; methodology: string | null;
};
export type CalcResult =
  | { ok: true; convertedQuantity: number; resultKg: number }
  | { ok: false; error: string };

/** Emissions = Activity Data x Emission Factor, with explicit unit conversion. Never guesses. */
export function calculate(quantity: number, unit: string, f: Factor): CalcResult {
  if (!Number.isFinite(quantity) || quantity < 0) return { ok: false, error: "Quantity must be a non-negative number." };
  const q = convert(quantity, unit, f.unit);
  if (q === null) return { ok: false, error: `Cannot convert ${unit} to the factor unit ${f.unit}. Choose a matching unit or factor.` };
  return { ok: true, convertedQuantity: q, resultKg: q * f.kgco2e_per_unit };
}
export const tonnes = (kg: number) => kg / 1000;
export const fmtT = (kg: number) => (kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });

export const SCOPE3_CATEGORIES = [
  "Purchased goods and services", "Capital goods", "Fuel and energy related activities", "Upstream transportation and distribution",
  "Waste generated in operations", "Business travel", "Employee commuting", "Upstream leased assets",
  "Downstream transportation and distribution", "Processing of sold products", "Use of sold products",
  "End of life treatment of sold products", "Downstream leased assets", "Franchises", "Investments",
];
