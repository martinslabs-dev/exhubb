import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/wallet/tx-status?reference=EXH-TOPUP-...
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "missing reference" }, { status: 400 });

  const tx = await prisma.walletTransaction.findUnique({ where: { reference } });
  if (!tx) return NextResponse.json({ status: "NOT_FOUND" });

  if (tx.userId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { walletBalance: true } });

  return NextResponse.json({ status: tx.status, balance: user?.walletBalance ?? 0, transaction: { id: tx.id, amount: tx.amount, reference: tx.reference } });
}
