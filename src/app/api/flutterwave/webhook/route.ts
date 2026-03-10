import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

// POST /api/flutterwave/webhook
// Flutterwave sends charge.completed, transfer.completed, etc.
// Must return 200 quickly — Flutterwave retries on non-200.
export async function POST(req: NextRequest) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  const signature  = req.headers.get("verif-hash");

  // Verify webhook signature
  if (!secretHash || signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    const raw = await req.text();
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventType: string = event?.event ?? "";
  const data = event?.data ?? {};

  // ── Charge completed (top-up) ─────────────────────────
  if (eventType === "charge.completed" && data.status === "successful") {
    const txRef  = data.tx_ref   as string | undefined;
    const flwRef = data.flw_ref  as string | undefined;
    const amount = Number(data.amount ?? 0);

    if (!txRef || amount <= 0) {
      return NextResponse.json({ received: true });
    }

    // Only process TOPUP transactions here (order payments handled separately)
    if (!txRef.startsWith("EXH-TOPUP-")) {
      return NextResponse.json({ received: true });
    }

    // Idempotent — only process once. If the pre-created tx wasn't present
    // (e.g. DB push happened after initialization), create-and-credit here.
    const existing = await prisma.walletTransaction.findUnique({ where: { reference: txRef } });

    if (existing?.status === "COMPLETED") {
      return NextResponse.json({ received: true });
    }

    if (!existing) {
      // Try to recover userId from meta (we set meta.userId at initialization)
      const userId = data?.meta?.userId as string | undefined;
      if (!userId) {
        console.warn("[flw/webhook] charge.completed: missing txRef and no meta.userId; skipping", txRef);
        return NextResponse.json({ received: true });
      }

      // Create transaction as COMPLETED and credit user atomically
      try {
        await prisma.$transaction(async (tx) => {
          await tx.walletTransaction.create({
            data: {
              userId,
              type: "TOP_UP",
              amount,
              description: "Wallet top-up via Flutterwave",
              reference: txRef,
              flwRef: flwRef ?? null,
              status: "COMPLETED",
            },
          });

          await tx.user.update({ where: { id: userId }, data: { walletBalance: { increment: amount } } });
        });
      } catch (err) {
        console.error("[flw/webhook] failed to create+credit tx:", err);
      }

      return NextResponse.json({ received: true });
    }

    // existing present but not completed: mark completed and credit
    try {
      await prisma.$transaction(async (tx) => {
        await tx.walletTransaction.update({ where: { reference: txRef }, data: { status: "COMPLETED", flwRef: flwRef ?? null } });
        await tx.user.update({ where: { id: existing.userId }, data: { walletBalance: { increment: amount } } });
      });
    } catch (err) {
      console.error("[flw/webhook] failed to update existing tx:", err);
    }
  }

  // ── Transfer completed (withdrawal payout) ────────────
  if (eventType === "transfer.completed") {
    const reference = data.reference as string | undefined;
    const status    = data.status    as string | undefined;

    if (!reference) return NextResponse.json({ received: true });

    const txRecord = await prisma.walletTransaction.findUnique({
      where: { reference },
    });

    if (!txRecord) return NextResponse.json({ received: true });

    if (status === "SUCCESSFUL") {
      await prisma.walletTransaction.update({
        where: { reference },
        data:  { status: "COMPLETED" },
      });
    } else if (status === "FAILED") {
      // Refund wallet balance
      await prisma.$transaction(async (tx) => {
        await tx.walletTransaction.update({
          where: { reference },
          data:  { status: "FAILED" },
        });
        await tx.user.update({
          where: { id: txRecord.userId },
          data:  { walletBalance: { increment: txRecord.amount } },
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
