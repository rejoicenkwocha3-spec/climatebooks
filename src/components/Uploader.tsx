"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { recordDocument } from "@/app/app/actions";
export function Uploader({ orgId }: { orgId: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const router = useRouter();
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setErr("");
    if (file.size > 20 * 1024 * 1024) return setErr("Files must be 20 MB or smaller.");
    setBusy(true);
    const path = `${orgId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabaseBrowser().storage.from("cb-documents").upload(path, file, { contentType: file.type || undefined });
    if (error) { setErr(error.message); setBusy(false); return; }
    const e2 = await recordDocument(orgId, file.name, path, file.size, file.type); if (e2) setErr(e2);
    setBusy(false); e.target.value = ""; router.refresh();
  }
  return (<div><label className="btn-primary cursor-pointer">{busy ? "Uploading" : "Upload document"}<input type="file" className="sr-only" onChange={onChange} disabled={busy} /></label>{err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}</div>);
}
