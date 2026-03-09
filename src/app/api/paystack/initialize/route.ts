import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST /api/paystack/initialize
// Body: { orderId: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json() as { orderId?: string; amount?: number; email?: string };
  const { orderId, amount, email } = body;

  if (!orderId || !amount || !email) {
    return NextResponse.json({ error: "orderId, amount and email are required" }, { status: 400 });
  }

  // Verify the order belongs to the current user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, paymentStatus: true },
  });

  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_xxxxxxxx")) {
    return NextResponse.json({ error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to your environment." }, { status: 503 });
  }

  // Amount in kobo (NGN × 100)
  const amountKobo = Math.round(amount * 100);

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference: `EXH-${orderId}-${Date.now()}`,
      metadata: { orderId, buyerId: session.user.id },
      callback_url: `${process.env.NEXTAUTH_URL}/orders/success?orderId=${orderId}`,
    }),
  });

  if (!paystackRes.ok) {
    const err = await paystackRes.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "Paystack initialisation failed" }, { status: 502 });
  }

  const data = await paystackRes.json() as { data: { authorization_url: string; reference: string; access_code: string } };

  // Store the reference on the order
  await prisma.order.update({
    where: { id: orderId },
    data: { paystackRef: data.data.reference },
  });

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference });
}
