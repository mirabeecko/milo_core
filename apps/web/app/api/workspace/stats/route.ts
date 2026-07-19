import { NextResponse } from "next/server";

const WS_API = "http://localhost:4002";

export async function GET() {
  try {
    const res = await fetch(`${WS_API}/workspace/stats`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
