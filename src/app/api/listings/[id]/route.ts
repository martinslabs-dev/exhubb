import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      title: true,
      description: true,
      category: true,
      subcategory: true,
      price: true,
      stock: true,
      unlimitedStock: true,
      tags: true,
      images: true,
      isActive: true,
      productType: true,
      digitalFiles: true,
      digitalFileNames: true,
      shipsFromCity: true,
      weight: true,
      shippingZones: true,
      nigeriaFee: true,
      africaFee: true,
      internationalFee: true,
      variants: {
        select: {
          id: true,
          name: true,
          value: true,
          price: true,
          stock: true,
          sku: true,
        },
      },
    },
  });

  if (!product || product.sellerId !== session.user.id) return new NextResponse(null, { status: 404 });

  return NextResponse.json({ product });
}
