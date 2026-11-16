export type Proposal = {
  id: string;
  title?: string;
  clientName?: string;
  content?: string;
  createdAt: string;
  [key: string]: unknown;
};

const globalForStore = globalThis as unknown as {
  __proposals?: Map<string, Proposal>;
};

const proposals: Map<string, Proposal> = (globalForStore.__proposals ??=
  new Map());

export async function saveProposal(proposal: Proposal): Promise<Proposal> {
  proposals.set(proposal.id, proposal);
  return proposal;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  return proposals.get(id) ?? null;
}