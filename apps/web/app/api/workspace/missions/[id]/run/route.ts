import { NextRequest, NextResponse } from "next/server";

const WS_API = "http://localhost:4002";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${WS_API}/workspace/missions/${params.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
