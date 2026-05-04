import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID missing" },
      { status: 500 },
    );
  }
  const r = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    return NextResponse.json(
      { error: "failed to fetch signed url", upstream: body.slice(0, 400) },
      { status: 502 },
    );
  }
  const data = (await r.json()) as { signed_url?: string };
  if (!data.signed_url) {
    return NextResponse.json({ error: "no signed_url in response" }, { status: 502 });
  }
  return NextResponse.json({ signedUrl: data.signed_url });
}
