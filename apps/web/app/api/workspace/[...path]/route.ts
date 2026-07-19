import { NextRequest, NextResponse } from "next/server";

const WORKSPACE_API = "http://localhost:4002";

// Proxy all workspace API calls server-side to avoid CORS
async function proxy(path: string, init?: RequestInit) {
  const res = await fetch(`${WORKSPACE_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/workspace", "");
  return proxy(`/workspace${path}`);
}

export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/workspace", "");
  const body = await req.json();
  return proxy(`/workspace${path}`, { method: "POST", body: JSON.stringify(body) });
}

export async function DELETE(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/workspace", "");
  return proxy(`/workspace${path}`, { method: "DELETE" });
}
