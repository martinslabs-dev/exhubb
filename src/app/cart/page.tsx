import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Package, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import CartItemControls from "./CartItemControls";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cart");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              seller: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const items = cart?.items ?? [];

  // Group by seller
  const bySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
    const sid = item.product.sellerId;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((s, item) => s + item.product.price * item.quantity, 0);
  const platformFee = subtotal * 0.05; // 5%
  // Shipping will be calculated at checkout after address is entered
  const total = subtotal + platformFee;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-black text-gray-900">Your Cart</h1>
            {items.length > 0 && (
              <span className="ml-auto text-sm text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-200 mb-5" />
              <p className="text-xl font-bold text-gray-800">Your cart is empty</p>
              <p className="text-gray-500 text-sm mt-1">Browse products and add items to get started.</p>
              <Link href="/products" className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Items ── */}
              <div className="lg:col-span-2 space-y-4">
                {Object.entries(bySeller).map(([sellerId, sellerItems]) => {
                  const sellerName = sellerItems[0].product.seller.name ?? "Seller";
                  return (
                    <div key={sellerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* seller header */}
                      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <Link href={`/sellers/${sellerId}`} className="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors">
                          {sellerName}
                        </Link>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {sellerItems.map((item) => (
                          <div key={item.id} className="flex gap-4 p-5">
                            {/* image */}
                            <Link href={`/products/${item.product.id}`} className="shrink-0">
                              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden relative">
                                {item.product.images[0] ? (
                                  <Image
                                    src={item.product.images[0]}
                                    alt={item.product.title}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            </Link>

                            {/* info */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/products/${item.product.id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 transition-colors">
                                {item.product.title}
                              </Link>
                              <p className="text-xs text-gray-400 mt-0.5">{item.product.category}</p>
                              <p className="text-base font-bold text-primary-600 mt-1.5">
                                ₦{(item.product.price * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">₦{item.product.price.toLocaleString()} each</p>
                            </div>

                            {/* controls */}
                            <CartItemControls
                              cartItemId={item.id}
                              quantity={item.quantity}
                              stock={item.product.stock}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Order Summary ── */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                  <h2 className="text-base font-bold text-gray-900 mb-5">Order Summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                      <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Platform fee (5%)</span>
                      <span className="font-semibold">₦{platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>Shipping</span>
                      <span className="italic">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between text-gray-900 font-bold text-base">
                      <span>Estimated Total</span>
                      <span className="text-primary-700">₦{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/products"
                    className="mt-3 w-full flex items-center justify-center py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
                  >
                    Continue Shopping
                  </Link>

                  {/* buyer protection */}
                  <div className="mt-5 bg-green-50 rounded-xl p-3 text-xs text-green-700 leading-relaxed">
                    🛡️ <strong>Buyer Protection:</strong> Your payment is held securely in escrow until you confirm delivery.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
