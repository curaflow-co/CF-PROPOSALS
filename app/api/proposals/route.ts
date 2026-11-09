// app/api/proposals/route.ts
import { NextResponse } from 'next/server';

// Temporary in-memory store (Replace with Supabase/database later)
export const proposalsStore = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Parse JSON string if Make.com sends it wrapped as a string
    const proposalData = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Generate a unique ID for this proposal
    const proposalId = `prop_${Date.now()}`;
    
    // Store the proposal payload
    proposalsStore.set(proposalId, proposalData);

    // Return the response URL back to Make.com
    return NextResponse.json({ 
      success: true, 
      proposalId, 
      url: `https://your-domain.vercel.app/proposal/${proposalId}` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process proposal data' }, { status: 500 });
  }
}