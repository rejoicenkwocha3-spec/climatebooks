import { Uploader } from "@/components/Uploader";
import { DeleteButton, Empty, NoOrg, PageHeader, Panel, Table } from "@/components/app";
import { canWrite, currentOrg } from "@/lib/auth";
export const metadata = { title: "Documents" };
export default async function Documents() {
  const { sb, org } = await currentOrg(); if (!org) return <NoOrg />;
  const w = canWrite(org.role);
  const { data } = await sb.from("cb_documents").select("*").eq("organisation_id", org.id).order("created_at", { ascending: false });
  const withUrls = await Promise.all((data ?? []).map(async (d: any) => ({ ...d, url: (await sb.storage.from("cb-documents").createSignedUrl(d.storage_path, 300)).data?.signedUrl })));
  return (<><PageHeader title="Documents" copy="Store evidence such as invoices, meter readings and supplier statements. Files are private to your organisation.">{w && <Uploader orgId={org.id} />}</PageHeader>
    <Panel>{withUrls.length ? (<Table head={["Name", "Size", "Uploaded", ""]}>{withUrls.map((d: any) => (<tr key={d.id}><td className="td">{d.url ? <a className="font-medium text-forest hover:underline" href={d.url}>{d.name}</a> : d.name}</td><td className="td">{d.size_bytes ? `${(d.size_bytes / 1024).toFixed(0)} KB` : ""}</td><td className="td">{d.created_at.slice(0, 10)}</td><td className="td"><DeleteButton table="documents" id={d.id} disabled={!w} /></td></tr>))}</Table>) : <Empty title="No documents yet" />}</Panel></>);
}
