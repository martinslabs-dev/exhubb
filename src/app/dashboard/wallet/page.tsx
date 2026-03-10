import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import WalletClient from "@/components/wallet/WalletClient";

export const metadata: Metadata = { title: "Wallet" };

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  const params  = await searchParams;

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session!.user.id },
      select: {
        name: true,
        walletBalance: true,
        bankName: true,
        bankCode: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    }),
    prisma.walletTransaction.findMany({
      where:   { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  const balance = user?.walletBalance ?? 0;
  const savedBank = user
    ? {
        bankName:          user.bankName,
        bankCode:          user.bankCode,
        bankAccountNumber: user.bankAccountNumber,
        bankAccountName:   user.bankAccountName,
      }
    : null;

  return (
    <WalletClient
      balance={balance}
      userName={user?.name ?? "User"}
      transactions={transactions}
      savedBank={savedBank}
      topupSuccess={params.topup === "1"}
    />
  );
}


