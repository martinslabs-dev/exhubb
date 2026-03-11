import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const FLW_SECRET = () => {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY not configured");
  return key;
};

// POST /api/flutterwave/initialize
// Body: { amount: number }  — top-up flow
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Minimum top-up is ₦100" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }

  // Unique idempotency reference
  const txRef = `EXH-TOPUP-${session.user.id.slice(-6).toUpperCase()}-${Date.now()}`;

  let secretKey: string;
  try {
    secretKey = FLW_SECRET();
  } catch {
    return NextResponse.json(
      { error: "Payment gateway is not configured. Contact support." },
      { status: 503 }
    );
  }

  const payload = {
    tx_ref: txRef,
    amount,
    currency: "NGN",
    redirect_url: `${process.env.NEXTAUTH_URL}/dashboard/wallet?topup=1`,
    customer: {
      email: user.email,
      name: user.name ?? "Exhubb User",
    },
    customizations: {
      title: "Exhubb Wallet Top-up",
      description: `Add ₦${amount.toLocaleString()} to your Exhubb wallet`,
      logo: `${process.env.NEXTAUTH_URL}/logo.png`,
    },
    meta: {
      userId: session.user.id,
      type: "TOPUP",
    },
  };

  const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!flwRes.ok) {
    const err = await flwRes.json() as { message?: string };
    console.error("[flw/initialize] Flutterwave error:", err);
    return NextResponse.json(
      { error: err.message ?? "Payment initialisation failed. Try again." },
      { status: 502 }
    );
  }

  const data = await flwRes.json() as {
    status: string;
    data?: { link: string };
    message?: string;
  };

  if (data.status !== "success" || !data.data?.link) {
    return NextResponse.json(
      { error: data.message ?? "Could not create payment link." },
      { status: 502 }
    );
  }

  // Pre-create a PENDING wallet transaction so the webhook can upsert it
  await prisma.walletTransaction.create({
    data: {
      userId:      session.user.id,
      type:        "TOP_UP",
      amount,
      description: "Wallet top-up via Flutterwave",
      reference:   txRef,
      status:      "PENDING",
    },
  });

  return NextResponse.json({ paymentLink: data.data.link, txRef });
}
