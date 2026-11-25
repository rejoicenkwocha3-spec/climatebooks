"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot" | "reset";
const copy: Record<Mode, { title: string; cta: string }> = {
  login: { title: "Log in to ClimateBooks", cta: "Log in" },
  signup: { title: "Create your account", cta: "Create account" },
  forgot: { title: "Reset your password", cta: "Send reset link" },
  reset: { title: "Choose a new password", cta: "Update password" },
};

function Form({ mode }: { mode: Mode }) {
  const sb = supabaseBrowser(); const router = useRouter(); const params = useSearchParams();
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim(); const password = String(f.get("password") ?? "");
    const name = String(f.get("name") ?? "").trim();
    if (mode !== "reset" && !/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if ((mode === "signup" || mode === "reset") && password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup" && !name) return setError("Enter your full name.");
    if (mode === "reset" && password !== String(f.get("confirm") ?? "")) return setError("Passwords do not match.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(params.get("next")?.startsWith("/app") ? params.get("next")! : "/app"); router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback?next=/app` } });
        if (error) throw error;
        if (data.session) { router.replace("/app"); router.refresh(); }
        else setNotice("Check your email: we sent a verification link. Open it to activate your account, then log in.");
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setNotice("If an account exists for that email, a reset link is on its way.");
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        setNotice("Password updated. Redirecting."); setTimeout(() => { router.replace("/app"); router.refresh(); }, 800);
      }
    } catch (err: any) { setError(err?.message ?? "Something went wrong. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h1 className="text-2xl font-extrabold">{copy[mode].title}</h1>
      {params.get("error") && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.get("error")}</p>}
      {mode === "signup" && <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" className="input" autoComplete="name" /></div>}
      {mode !== "reset" && <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" autoComplete="email" /></div>}
      {mode !== "forgot" && <div><label className="label" htmlFor="password">{mode === "reset" ? "New password" : "Password"}</label><input id="password" name="password" type="password" className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>}
      {mode === "reset" && <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" /></div>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-forest/10 p-3 text-sm text-emerald">{notice}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait" : copy[mode].cta}</button>
      <div className="flex justify-between text-sm text-forest">
        {mode === "login" && (<><Link href="/forgot-password">Forgot password?</Link><Link href="/signup">Create account</Link></>)}
        {mode === "signup" && <Link href="/login">Already have an account? Log in</Link>}
        {mode === "forgot" && <Link href="/login">Back to log in</Link>}
      </div>
    </form>
  );
}
export function AuthForm({ mode }: { mode: Mode }) { return <Suspense><Form mode={mode} /></Suspense>; }
