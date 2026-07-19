import { NextResponse } from "next/server";

const API_BASE = "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/calendar/events`, {
      headers: {
        "Content-Type": "application/json",
      },
      // Server-side fetch — no CORS issues
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch calendar" },
      { status: 502 }
    );
  }
}
