"use client";
import { useActionState, useEffect, useRef } from "react";
import type { State } from "@/app/app/actions";

export function ActionForm({ action, children, submit = "Save", className = "grid gap-4 sm:grid-cols-2" }: {
  action: (s: State, f: FormData) => Promise<State>; children: React.ReactNode; submit?: string; className?: string;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving" : submit}</button>
        {state?.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm font-medium text-forest">{state.ok}</p>}
      </div>
    </form>
  );
}
export function Field({ label, name, type = "text", required, placeholder, defaultValue, step, children, className = "" }: any) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      {children ?? <input id={name} name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} step={step} className="input" />}
    </div>
  );
}
export function Select({ label, name, options, required, defaultValue, className = "", blank }: { label: string; name: string; options: { value: string | number; label: string }[]; required?: boolean; defaultValue?: string; className?: string; blank?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ""} className="input">
        {(blank !== undefined || !required) && <option value="">{blank ?? "None"}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
