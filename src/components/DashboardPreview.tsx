// Static illustration for the marketing site. Figures are sample values, labelled as such.
export function DashboardPreview() {
  const bars = [62, 48, 71, 40, 55, 36, 44, 30];
  return (
    <div className="card overflow-hidden" aria-label="Illustrative ClimateBooks dashboard preview">
      <div className="flex items-center justify-between border-b border-forest/10 bg-offwhite px-4 py-2.5">
        <span className="text-xs font-semibold text-emerald">Overview</span>
        <span className="badge bg-gold/20 text-emerald">Sample data</span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-4">
        {[["Total", "1,284 tCO2e"], ["Scope 1", "212 tCO2e"], ["Scope 2", "340 tCO2e"], ["Scope 3", "732 tCO2e"]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-forest/10 p-3"><p className="text-[11px] font-semibold uppercase text-charcoal/60">{k}</p><p className="mt-1 font-display text-lg font-extrabold text-emerald">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-3 p-4 pt-0 sm:grid-cols-3">
        <div className="rounded-lg border border-forest/10 p-3 sm:col-span-2">
          <p className="mb-3 text-xs font-semibold text-charcoal/70">Emissions by category</p>
          <div className="flex h-32 items-end gap-2">{bars.map((h, i) => <div key={i} className="flex-1 rounded-t bg-forest" style={{ height: `${h}%`, opacity: 1 - i * 0.07 }} />)}</div>
        </div>
        <div className="rounded-lg border border-forest/10 p-3">
          <p className="mb-3 text-xs font-semibold text-charcoal/70">Progress to target</p>
          <div className="h-3 rounded-full bg-forest/10"><div className="h-3 w-[42%] rounded-full bg-gold" /></div>
          <p className="mt-2 text-xs text-charcoal/70">42% of planned reduction</p>
          <p className="mt-4 text-xs text-charcoal/70">Data quality: 68% measured</p>
        </div>
      </div>
    </div>
  );
}
