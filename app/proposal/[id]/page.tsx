// app/proposal/[id]/page.tsx
import { notFound } from 'next/navigation';

interface ProposalData {
  proposalTitle: string;
  luxuryConceptSummary: string;
  recommendedVenues: { name: string; location: string; highlight: string }[];
  estimatedCostBreakdown: {
    totalBudgetTier: string;
    categories: { category: string; allocatedPercentage: string; details: string }[];
  };
}

async function getProposal(id: string): Promise<ProposalData | null> {
  // Fetches proposal from our local API route
  const res = await fetch(`http://localhost:3000/api/proposals?id=${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProposalPage({ params }: { params: { id: string } }) {
  const proposal = await getProposal(params.id);

  if (!proposal) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-serif text-amber-200">Proposal Pending Generation</h1>
          <p className="text-neutral-400 text-sm">Please wait a moment and refresh, or submit a new form request.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-16 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Luxury Header */}
        <header className="border-b border-neutral-800 pb-8 text-center space-y-4">
          <p className="text-xs tracking-widest text-amber-400 uppercase font-medium">Bespoke Event Proposal</p>
          <h1 className="text-4xl md:text-5xl font-serif text-amber-100 tracking-tight">{proposal.proposalTitle}</h1>
        </header>

        {/* Concept Summary */}
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 space-y-3">
          <h2 className="text-xl font-serif text-amber-300">The Vision & Concept</h2>
          <p className="text-neutral-300 leading-relaxed text-base font-light">{proposal.luxuryConceptSummary}</p>
        </section>

        {/* Recommended Venues */}
        <section className="space-y-6">
          <h2 className="text-2xl font-serif text-amber-200">Curated Venues</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {proposal.recommendedVenues.map((venue, idx) => (
              <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3 hover:border-amber-500/40 transition">
                <h3 className="text-lg font-semibold text-neutral-100">{venue.name}</h3>
                <p className="text-xs text-amber-400 font-mono">{venue.location}</p>
                <p className="text-sm text-neutral-400 leading-snug">{venue.highlight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-serif text-amber-200">Investment Summary</h2>
            <span className="text-sm font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              {proposal.estimatedCostBreakdown.totalBudgetTier}
            </span>
          </div>
          <div className="space-y-4">
            {proposal.estimatedCostBreakdown.categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-neutral-200">{cat.category}</span>
                  <span className="text-amber-300 font-mono">{cat.allocatedPercentage}</span>
                </div>
                <p className="text-xs text-neutral-400">{cat.details}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}