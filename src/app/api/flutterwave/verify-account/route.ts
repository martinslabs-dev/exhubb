import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

// GET /api/flutterwave/verify-account?account_number=0123456789&account_bank=044
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!FLW_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const accountNumber = searchParams.get("account_number");
  const accountBank   = searchParams.get("account_bank");

  if (!accountNumber || !accountBank) {
    return NextResponse.json({ error: "account_number and account_bank are required" }, { status: 400 });
  }

  const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ account_number: accountNumber, account_bank: accountBank }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not verify account" }, { status: 502 });
  }

  const data = await res.json() as {
    status: string;
    data?: { account_number: string; account_name: string };
    message?: string;
  };

  if (data.status !== "success" || !data.data) {
    return NextResponse.json({ error: data.message ?? "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ accountName: data.data.account_name });
}
