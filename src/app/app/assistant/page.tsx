import { Assistant } from "@/components/Assistant";
import { NoOrg, PageHeader } from "@/components/app";
import { currentOrg } from "@/lib/auth";
export const metadata = { title: "AI Assistant" };
export default async function Page() {
  const { org } = await currentOrg(); if (!org) return <NoOrg />;
  return (<><PageHeader title="AI Assistant" copy="Grounded in your organisation's records. It will not invent data, factors or compliance status." /><Assistant /></>);
}
