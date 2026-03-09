import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

// POST /api/paystack/webhook
// Paystack sends charge.success, transfer.success, etc.
export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: {
      reference: string;
      status: string;
      metadata?: { orderId?: string };
    };
  };

  if (event.event === "charge.success" && event.data.status === "success") {
    const reference = event.data.reference;

    const order = await prisma.order.findFirst({
      where: { paystackRef: reference },
      select: { id: true, paymentStatus: true },
    });

    if (order && order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
