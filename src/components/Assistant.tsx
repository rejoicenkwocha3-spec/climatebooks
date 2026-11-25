"use client";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = ["What is our total carbon footprint?", "Which activities contribute most to our emissions?", "What are our highest emitting business operations?", "How have our emissions changed this year?", "What are our biggest Scope 3 emission sources?", "Generate a sustainability performance summary.", "Recommend opportunities to reduce emissions.", "Are there unusual data values I should check?"];
export function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const end = useRef<HTMLDivElement>(null);
  async function ask(q: string) {
    if (!q.trim() || busy) return; setErr(""); const next = [...msgs, { role: "user" as const, content: q }]; setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Request failed");
      setMsgs([...next, { role: "assistant", content: j.reply }]);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50); }
  }
  return (
    <div className="card flex h-[34rem] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {msgs.length === 0 && (<div><p className="text-sm text-charcoal/70">Ask about your recorded data. Answers use only your records and say so when data is missing.</p>
          <div className="mt-4 flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-forest/20 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/5">{s}</button>)}</div></div>)}
        {msgs.map((m, i) => (<div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-forest px-4 py-2.5 text-sm text-white" : "max-w-[90%] whitespace-pre-wrap rounded-xl bg-offwhite px-4 py-2.5 text-sm"}>{m.content}</div>))}
        {busy && <p className="text-sm text-charcoal/60">Analysing your data</p>}
        {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-forest/10 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="input" placeholder="Ask about your emissions" aria-label="Question" maxLength={1000} />
        <button className="btn-primary" disabled={busy} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
