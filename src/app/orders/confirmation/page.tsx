import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, Clock, ArrowRight, Home, Download, Zap } from "lucide-react";
import Navbar from "@/components/sections/Navbar";

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "COMPLETED"];

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const ids = params.ids?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) redirect("/");

  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, buyerId: session.user.id },
    include: {
      product: { select: { title: true, images: true, productType: true, digitalFileNames: true } },
      seller:  { select: { name: true } },
    },
  });

  if (orders.length === 0) redirect("/");

  const allDigital = orders.every((o) => o.product?.productType === "DIGITAL");

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* success header */}
          <div className="text-center mb-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${allDigital ? "bg-indigo-100" : "bg-green-100"}`}>
              {allDigital
                ? <Zap className="w-10 h-10 text-indigo-600" />
                : <CheckCircle2 className="w-10 h-10 text-green-600" />
              }
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              {allDigital ? "Payment Received! Your Files Are Ready" : "Order Placed!"}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {allDigital
                ? "Download your digital product(s) below. Links are also available in your orders dashboard."
                : `${orders.length > 1 ? `${orders.length} orders have` : "Your order has"} been placed and the seller${orders.length > 1 ? "s have" : " has"} been notified.`
              }
            </p>
          </div>

          {/* orders */}
          <div className="space-y-4 mb-8">
            {orders.map((order) => {
              const isDigital = order.product?.productType === "DIGITAL";
              return (
                <div key={order.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isDigital ? "border-indigo-100" : "border-gray-100"}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {isDigital
                      ? <Zap className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                      : <Package className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">
                        {order.product?.title ?? "Order"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sold by {order.seller?.name ?? "Seller"} · Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${isDigital ? "bg-indigo-100 text-indigo-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {isDigital ? "⚡ Ready to Download" : "Awaiting Confirmation"}
                    </span>
                  </div>

                  {/* Digital: download button */}
                  {isDigital && order.downloadToken ? (
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-xs text-indigo-700 font-semibold mb-1">
                        Files included ({order.product?.digitalFileNames.length ?? 1})
                      </p>
                      {order.product?.digitalFileNames.length ? (
                        <ul className="text-xs text-gray-600 mb-3 space-y-0.5 list-disc list-inside">
                          {order.product.digitalFileNames.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      ) : null}
                      <a
                        href={`/api/download/${order.downloadToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download Files
                      </a>
                    </div>
                  ) : !isDigital ? (
                    <>
                      {/* mini tracking timeline for physical */}
                      <div className="flex items-center gap-1">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="flex items-center gap-1 flex-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${step === "PENDING" ? "bg-primary-500" : "bg-gray-200"}`} />
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 ${i === 0 ? "bg-primary-200" : "bg-gray-100"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                        {STATUS_STEPS.map((s) => (
                          <span key={s} className={s === "PENDING" ? "text-primary-600 font-semibold" : ""}>
                            {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{order.courierName ?? "Courier TBD"}</span>
                          {order.estimatedDays ? (
                            <span className="flex items-center gap-1 text-gray-400">
                              · <Clock className="w-3 h-3" /> {order.estimatedDays} days est.
                            </span>
                          ) : null}
                        </div>
                        <span className="font-bold text-primary-700">₦{order.amount.toLocaleString()}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* escrow notice */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-8 text-sm text-primary-800">
            <p className="font-bold mb-1">🛡️ Your payment is protected</p>
            <p className="text-xs leading-relaxed">
              Your payment will be held securely in escrow. It&apos;s only released to the seller after you confirm you&apos;ve received your item. If there&apos;s a problem, you can open a dispute and we&apos;ll step in.
            </p>
          </div>

          {/* actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/buyer/orders"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Track Orders <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
