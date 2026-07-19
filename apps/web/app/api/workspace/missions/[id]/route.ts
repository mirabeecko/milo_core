import { NextRequest, NextResponse } from "next/server";

const WS_API = "http://localhost:4002";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${WS_API}/workspace/missions/${params.id}/status`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // "run" action → POST /workspace/missions/:id/run
    if (body.action === "run") {
      const res = await fetch(`${WS_API}/workspace/missions/${params.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return NextResponse.json(await res.json(), { status: res.status });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${WS_API}/workspace/missions/${params.id}`, { method: "DELETE" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
