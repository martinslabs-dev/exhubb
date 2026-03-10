import { NextResponse } from "next/server";
import { auth } from "@/auth";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

// GET /api/flutterwave/banks
// Returns list of Nigerian banks from Flutterwave
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!FLW_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
  }

  const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
    headers: { Authorization: `Bearer ${FLW_SECRET}` },
    next: { revalidate: 86400 }, // cache for 24h — bank list rarely changes
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch bank list" }, { status: 502 });
  }

  const data = await res.json() as { data?: { id: number; name: string; code: string }[] };
  return NextResponse.json({ banks: data.data ?? [] });
}
