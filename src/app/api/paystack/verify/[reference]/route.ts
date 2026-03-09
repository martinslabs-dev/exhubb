import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/paystack/verify/[reference]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reference } = await params;
  if (!reference) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_xxxxxxxx")) {
    return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
  }

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!paystackRes.ok) {
    const err = await paystackRes.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 502 });
  }

  const data = await paystackRes.json() as {
    data: {
      status: string;
      reference: string;
      metadata: { orderId: string; buyerId: string };
      amount: number;
    };
  };

  const { status, metadata } = data.data;

  if (status !== "success") {
    return NextResponse.json({ success: false, status });
  }

  // Update the order
  const order = await prisma.order.findFirst({
    where: { paystackRef: reference },
    select: { id: true, buyerId: true, paymentStatus: true },
  });

  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    });
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
