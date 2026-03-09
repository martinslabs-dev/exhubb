import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { downloadToken: token },
    include: {
      product: { select: { digitalFiles: true, digitalFileNames: true, productType: true } },
    },
  });

  // Ensure the requesting user is the buyer of this order
  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order has been cancelled" }, { status: 403 });
  }

  if (order.product?.productType !== "DIGITAL" || !order.product.digitalFiles.length) {
    return NextResponse.json({ error: "No digital files for this order" }, { status: 404 });
  }

  // Increment download count
  await prisma.order.update({
    where: { id: order.id },
    data: { downloadCount: { increment: 1 } },
  });

  // If single file, redirect directly; if multiple, redirect to the first
  // (a more complete implementation would zip them server-side)
  const fileUrl = order.product.digitalFiles[0];

  return NextResponse.redirect(fileUrl, { status: 302 });
}
