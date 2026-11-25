"use client";
import { useState } from "react";
export function Scenario({ s1, s2, s3 }: { s1: number; s2: number; s3: number }) {
  const [r, setR] = useState([0, 0, 0]); const base = [s1, s2, s3]; const total = base.reduce((a, b) => a + b, 0);
  const proj = base.map((v, i) => v * (1 - r[i] / 100)); const pt = proj.reduce((a, b) => a + b, 0);
  const fmt = (n: number) => (n / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <div>
      <p className="mb-3 rounded-lg bg-gold/15 p-3 text-xs text-emerald">Modelled scenario: a what if calculation on your recorded totals. It is not measured data.</p>
      <div className="grid gap-4 sm:grid-cols-3">{["Scope 1", "Scope 2", "Scope 3"].map((l, i) => (
        <div key={l}><label className="label" htmlFor={`sc${i}`}>{l} reduction: {r[i]}%</label>
          <input id={`sc${i}`} type="range" min={0} max={100} value={r[i]} onChange={(e) => setR(r.map((x, j) => (j === i ? Number(e.target.value) : x)))} className="w-full accent-[#174D36]" />
          <p className="text-xs text-charcoal/65">{fmt(base[i])} to {fmt(proj[i])} tCO2e</p></div>))}</div>
      <p className="mt-4 text-sm font-semibold text-emerald">Modelled total: {fmt(pt)} tCO2e ({total > 0 ? ((1 - pt / total) * 100).toFixed(1) : "0"}% below current recorded {fmt(total)} tCO2e)</p>
    </div>
  );
}
