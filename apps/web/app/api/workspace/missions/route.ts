import { NextResponse } from "next/server";

const WS_API = "http://localhost:4002";

async function proxyGet(path: string) {
  try {
    const res = await fetch(`${WS_API}${path}`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

async function proxyPost(path: string, body: any) {
  try {
    const res = await fetch(`${WS_API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

async function proxyDelete(path: string) {
  try {
    const res = await fetch(`${WS_API}${path}`, { method: "DELETE" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export async function GET() {
  return proxyGet("/workspace/missions");
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/workspace/missions", body);
}
