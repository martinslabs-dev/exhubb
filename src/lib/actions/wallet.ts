"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const MIN_WITHDRAWAL = 1000;  // ₦1,000
const MAX_WITHDRAWAL = 500000; // ₦500,000 per transaction

const withdrawSchema = z.object({
  amount:        z.number().min(MIN_WITHDRAWAL, `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`).max(MAX_WITHDRAWAL, `Maximum withdrawal is ₦${MAX_WITHDRAWAL.toLocaleString()}`),
  bankCode:      z.string().min(1, "Select a bank"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName:   z.string().min(2, "Account name is required"),
  bankName:      z.string().min(1, "Bank name is required"),
});

export interface WalletActionResult {
  error?: string;
  success?: string;
}

// ─── Initiate Withdrawal ──────────────────────────────────────
export async function withdrawAction(
  _prev: WalletActionResult | null,
  formData: FormData
): Promise<WalletActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Session expired. Please sign in again." };

  const raw = {
    amount:        Number(formData.get("amount")),
    bankCode:      formData.get("bankCode")      as string,
    accountNumber: formData.get("accountNumber") as string,
    accountName:   formData.get("accountName")   as string,
    bankName:      formData.get("bankName")       as string,
  };

  const parsed = withdrawSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, bankCode, accountNumber, accountName, bankName } = parsed.data;

  // Fetch fresh balance inside a transaction to prevent race conditions
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { walletBalance: true, email: true, name: true },
  });

  if (!user) return { error: "User not found." };
  if (user.walletBalance < amount) {
    return { error: `Insufficient balance. You have ₦${user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} available.` };
  }

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return { error: "Payment gateway is not configured. Contact support." };

  const txRef = `EXH-PAYOUT-${session.user.id.slice(-6).toUpperCase()}-${Date.now()}`;

  // Atomic: deduct wallet + create PENDING transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data:  { walletBalance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId:      session.user.id,
        type:        "PAYOUT",
        amount,
        description: `Withdrawal to ${bankName} ···${accountNumber.slice(-4)}`,
        reference:   txRef,
        status:      "PENDING",
      },
    });
    // Save bank details for future use
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        bankCode,
        bankAccountNumber: accountNumber,
        bankAccountName:   accountName,
        bankName,
      },
    });
  });

  // Initiate Flutterwave transfer
  const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_bank:    bankCode,
      account_number:  accountNumber,
      amount,
      narration:       "Exhubb wallet withdrawal",
      currency:        "NGN",
      reference:       txRef,
      callback_url:   `${process.env.NEXTAUTH_URL}/api/flutterwave/webhook`,
      debit_currency: "NGN",
    }),
  });

  if (!flwRes.ok) {
    const err = await flwRes.json() as { message?: string };
    console.error("[withdrawAction] FLW transfer error:", err);
    // Rollback: refund the balance and mark transaction as FAILED
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data:  { walletBalance: { increment: amount } },
      });
      await tx.walletTransaction.update({
        where: { reference: txRef },
        data:  { status: "FAILED" },
      });
    });
    return { error: err.message ?? "Transfer initiation failed. Your balance has been refunded." };
  }

  revalidatePath("/dashboard/wallet");
  return { success: `₦${amount.toLocaleString()} is being transferred to your account. It usually arrives within minutes.` };
}

// ─── Save bank details only (for settings) ───────────────────
export async function saveBankDetailsAction(
  _prev: WalletActionResult | null,
  formData: FormData
): Promise<WalletActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Session expired." };

  const bankCode      = formData.get("bankCode")      as string;
  const accountNumber = formData.get("accountNumber") as string;
  const accountName   = formData.get("accountName")   as string;
  const bankName      = formData.get("bankName")       as string;

  if (!bankCode || !accountNumber || !accountName || !bankName) {
    return { error: "All bank fields are required." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { bankCode, bankAccountNumber: accountNumber, bankAccountName: accountName, bankName },
  });

  revalidatePath("/dashboard/settings/payouts");
  return { success: "Bank details saved successfully." };
}
