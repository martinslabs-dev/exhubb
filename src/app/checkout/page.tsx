import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, MapPin, Truck, ShieldCheck } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { seller: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const items = cart?.items ?? [];
  if (items.length === 0) redirect("/cart");

  const allDigital = items.length > 0 && items.every((i) => i.product.productType === "DIGITAL");

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const platformFee = subtotal * 0.05;

  // Fetch user's saved location as default
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, location: true, email: true },
  });

  const primarySellerId = items[0]?.product.seller.id ?? "";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
            <nav className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <Link href="/cart" className="hover:text-primary-600">Cart</Link>
              <span>›</span>
              <span className="text-primary-600 font-semibold">Shipping &amp; Payment</span>
              <span>›</span>
              <span>Confirmation</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Form ── */}
            <div className="lg:col-span-2">
              <CheckoutForm
                defaultName={user?.name ?? ""}
                defaultPhone={user?.phone ?? ""}
                defaultEmail={user?.email ?? session.user.email ?? ""}
                subtotal={subtotal}
                platformFee={platformFee}
                isAllDigital={allDigital}
                primarySellerId={primarySellerId}
                shippingZones={
                  // intersection of all product zones
                  (["NIGERIA", "AFRICA", "INTERNATIONAL"] as const).filter((z) =>
                    items.every((i) => i.product.shippingZones.includes(z))
                  )
                }
                productFees={{
                  nigeriaFee:       items[0]?.product.nigeriaFee       ?? null,
                  africaFee:        items[0]?.product.africaFee        ?? null,
                  internationalFee: items[0]?.product.internationalFee ?? null,
                }}
              />
            </div>

            {/* ── Right: Order summary ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Order Summary ({items.length} items)</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 relative overflow-hidden shrink-0">
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.product.title}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-primary-600">₦{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform fee (5%)</span>
                    <span className="font-semibold">₦{platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Shipping</span>
                    <span className="text-primary-600 font-medium" id="shipping-total-display">Select address →</span>
                  </div>
                </div>
              </div>

              {/* trust */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                {[
                  { icon: ShieldCheck, label: "Escrow Protection", desc: "Payment held until you confirm delivery" },
                  { icon: Truck,       label: "Multiple Couriers",  desc: "GIG · DHL · FedEx · Aramex" },
                  { icon: MapPin,      label: "Tracked Delivery",   desc: "Real-time tracking on all orders" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
