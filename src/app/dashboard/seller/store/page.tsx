import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import StoreSetupClient from "./StoreSetupClient";

export const metadata: Metadata = { title: "My Store — Seller Hub" };

export default async function SellerStorePage() {
  const session = await auth();
  if (!session?.user?.isSeller) redirect("/dashboard/buyer");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeBio: true,
      storeLogo: true,
      storeBanner: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      sellerStatus: true,
      isSellerVerified: true,
    },
  });

  if (!user) redirect("/dashboard/buyer");

  return (
    <StoreSetupClient
      user={{
        ...user,
        sellerStatus: user.sellerStatus as string,
      }}
    />
  );
}
