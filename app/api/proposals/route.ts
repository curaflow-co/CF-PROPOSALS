import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveProposal } from "@/lib/store";

export async function POST(req: Request) {
  const apiKey = process.env.PROPOSALS_API_KEY;
  if (apiKey && req.headers.get("x-api-key") !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Make.com sometimes sends the JSON wrapped as a string
    const data = typeof body === "string" ? JSON.parse(body) : body;

    const id = `prop_${randomUUID()}`;
    await saveProposal({
      ...data,
      id,
      createdAt: new Date().toISOString(),
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json(
      { success: true, proposalId: id, url: `${origin}/proposal/${id}` },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process proposal data" },
      { status: 400 }
    );
  }
}
