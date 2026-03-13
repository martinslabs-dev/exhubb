import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import EditGigClient from "./EditGigClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGigPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const gig = await prisma.gig.findUnique({
    where: { id },
    select: {
      id: true,
      freelancerId: true,
      title: true,
      description: true,
    category: true,
    subcategory: true,
      deliveryDays: true,
      basicPrice: true,
      standardPrice: true,
      premiumPrice: true,
      tags: true,
      samples: true,
      isActive: true,
    },
  });

  if (!gig || gig.freelancerId !== session?.user?.id) notFound();

  return <EditGigClient gig={gig} />;
}
