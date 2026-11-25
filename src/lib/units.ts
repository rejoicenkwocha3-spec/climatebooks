// Physical unit conversions (exact definitions). Units not listed must match the factor unit exactly.
type Group = { base: string; units: Record<string, number> };
const GROUPS: Group[] = [
  { base: "kWh", units: { kWh: 1, MWh: 1000, GWh: 1e6, MJ: 1 / 3.6, GJ: 1000 / 3.6, therm: 29.307107 } },
  { base: "km", units: { km: 1, m: 0.001, mile: 1.609344 } },
  { base: "kg", units: { kg: 1, tonne: 1000, g: 0.001, lb: 0.45359237 } },
  { base: "litre", units: { litre: 1, m3: 1000, "gallon (US)": 3.785411784, "gallon (UK)": 4.54609 } },
];
export const ALL_UNITS = Array.from(new Set(GROUPS.flatMap((g) => Object.keys(g.units))));
export function convert(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const g = GROUPS.find((x) => from in x.units && to in x.units);
  if (!g) return null;
  return (value * g.units[from]) / g.units[to];
}
