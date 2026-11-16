import { notFound } from "next/navigation";
import { getProposal } from "@/lib/store";
import ProposalClient from "./ProposalClient";

export const dynamic = "force-dynamic";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);

  if (!proposal) notFound();

  return <ProposalClient proposal={proposal as Record<string, unknown>} />;
}
