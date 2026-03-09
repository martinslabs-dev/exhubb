import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import DiscountsClient from "./DiscountsClient";

export const metadata: Metadata = { title: "Discount Codes" };

export default async function SellerDiscountsPage() {
  const session = await auth();

  const codes = await prisma.discountCode.findMany({
    where: { sellerId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <DiscountsClient codes={codes} />;
}
