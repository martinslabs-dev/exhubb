"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Truck, CreditCard, ChevronDown, Tag, CheckCircle2, X } from "lucide-react";
import { placeOrderAction } from "@/lib/actions/checkout";
import { validateDiscountCodeAction } from "@/lib/actions/discount";
import { getCouriersForZone, getEtaForZone } from "@/lib/checkout-utils";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "NG", name: "Nigeria 🇳🇬" },
  { code: "GH", name: "Ghana 🇬🇭" },
  { code: "KE", name: "Kenya 🇰🇪" },
  { code: "ZA", name: "South Africa 🇿🇦" },
  { code: "EG", name: "Egypt 🇪🇬" },
  { code: "SN", name: "Senegal 🇸🇳" },
  { code: "CM", name: "Cameroon 🇨🇲" },
  { code: "TZ", name: "Tanzania 🇹🇿" },
  { code: "UG", name: "Uganda 🇺🇬" },
  { code: "ET", name: "Ethiopia 🇪🇹" },
  { code: "GB", name: "United Kingdom 🇬🇧" },
  { code: "US", name: "United States 🇺🇸" },
  { code: "CA", name: "Canada 🇨🇦" },
  { code: "DE", name: "Germany 🇩🇪" },
  { code: "FR", name: "France 🇫🇷" },
  { code: "AE", name: "UAE 🇦🇪" },
  { code: "CN", name: "China 🇨🇳" },
  { code: "IN", name: "India 🇮🇳" },
];

function detectZone(country: string): "NIGERIA" | "AFRICA" | "INTERNATIONAL" | null {
  if (!country) return null;
  if (country === "NG") return "NIGERIA";
  const africaCodes = [
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI","DJ","EG",
    "GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML",
    "MR","MU","MA","MZ","NA","NE","RW","ST","SN","SL","SO","ZA","SS","SD","TZ","TG",
    "TN","UG","ZM","ZW",
  ];
  if (africaCodes.includes(country)) return "AFRICA";
  return "INTERNATIONAL";
}

const ZONE_FEE_DEFAULTS: Record<string, number> = {
  NIGERIA: 2000,
  AFRICA: 8000,
  INTERNATIONAL: 20000,
};

interface Props {
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  subtotal: number;
  platformFee: number;
  isAllDigital?: boolean;
  shippingZones: ("NIGERIA" | "AFRICA" | "INTERNATIONAL")[];
  productFees: {
    nigeriaFee?: number | null;
    africaFee?: number | null;
    internationalFee?: number | null;
  };
  primarySellerId?: string;
}

export default function CheckoutForm({
  defaultName, defaultPhone, defaultEmail, subtotal, platformFee, isAllDigital = false,
  shippingZones, productFees, primarySellerId,
}: Props) {
  const router = useRouter();
  const [country,  setCountry]  = useState("NG");
  const [courier,  setCourier]  = useState("");
  const [error,    setError]    = useState("");
  const [isPending, startTransition] = useTransition();

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amount: number; id: string } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const zone = isAllDigital ? ("NIGERIA" as const) : detectZone(country);
  const couriers = (!isAllDigital && zone) ? getCouriersForZone(zone) : [];

  const shippingFee = isAllDigital ? 0 : (zone
    ? (zone === "NIGERIA"       ? (productFees.nigeriaFee       ?? ZONE_FEE_DEFAULTS.NIGERIA) :
       zone === "AFRICA"        ? (productFees.africaFee        ?? ZONE_FEE_DEFAULTS.AFRICA) :
       (productFees.internationalFee ?? ZONE_FEE_DEFAULTS.INTERNATIONAL))
    : 0);

  const eta = (!isAllDigital && zone && courier) ? getEtaForZone(zone, courier) : null;
  const discountAmount = discountApplied?.amount ?? 0;
  const total = subtotal + platformFee + shippingFee - discountAmount;

  const zoneAvailable = isAllDigital || (zone && shippingZones.includes(zone));

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountError("");
    setValidatingDiscount(true);
    const orderTotal = subtotal + shippingFee;
    const result = await validateDiscountCodeAction(
      discountInput,
      orderTotal,
      primarySellerId ?? ""
    );
    setValidatingDiscount(false);
    if (result.error) {
      setDiscountError(result.error);
    } else if (result.success) {
      setDiscountApplied({ code: result.code!, amount: result.discountAmount!, id: result.discountCodeId! });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!isAllDigital && !courier) { setError("Please select a courier."); return; }
    if (!zoneAvailable) { setError("Some items do not ship to the selected country."); return; }

    const formData = new FormData(e.currentTarget);
    if (discountApplied) {
      formData.set("discountCodeId", discountApplied.id);
      formData.set("discountAmount", String(discountApplied.amount));
    }
    startTransition(async () => {
      const result = await placeOrderAction(formData);
      if (result?.error) { setError(result.error); return; }
      if (!result?.success) return;

      const { orderIds } = result;
      const firstOrderId = orderIds[0];
      const paystackKey  = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const totalAmount  = Math.max(0, total);

      // If Paystack is configured, initialize payment
      if (paystackKey && !paystackKey.includes("xxxxxxxx") && defaultEmail) {
        try {
          const payRes = await fetch("/api/paystack/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: firstOrderId, amount: totalAmount, email: defaultEmail }),
          });
          if (payRes.ok) {
            const payData = await payRes.json() as { authorizationUrl?: string };
            if (payData.authorizationUrl) {
              window.location.href = payData.authorizationUrl;
              return;
            }
          }
        } catch {
          // Fall through to confirmation
        }
      }

      // Default: redirect to confirmation
      router.push(`/orders/confirmation?ids=${orderIds.join(",")}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Digital Delivery Banner ── */}
      {isAllDigital && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900">⚡ Instant Digital Delivery</p>
            <p className="text-xs text-indigo-700 mt-0.5">Your order is all digital — no shipping required. You'll receive download links immediately after placing your order.</p>
          </div>
        </div>
      )}

      {/* ── Section: Delivery Address (physical only) ── */}
      {!isAllDigital && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-primary-500" /> Delivery Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name *</label>
              <input
                name="shippingName"
                defaultValue={defaultName}
                required
                placeholder="John Doe"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number *</label>
              <input
                name="shippingPhone"
                defaultValue={defaultPhone}
                required
                placeholder="+234 800 000 0000"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Street Address *</label>
              <input
                name="shippingAddress"
                required
                placeholder="123 Main Street, Apartment 4B"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">City *</label>
              <input
                name="shippingCity"
                required
                placeholder="Lagos"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">State / Province</label>
              <input
                name="shippingState"
                placeholder="Lagos State"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Country *</label>
              <div className="relative">
                <select
                  name="shippingCountry"
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setCourier(""); }}
                  required
                  className="w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="OTHER">Other country</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Shipping Method (physical only) ── */}
      {!isAllDigital && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-primary-500" /> Shipping Method
          </h2>

          {zone && (
            <div className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4",
              zone === "NIGERIA"       ? "bg-green-100 text-green-700" :
              zone === "AFRICA"        ? "bg-yellow-100 text-yellow-700" :
              "bg-primary-100 text-primary-700"
            )}>
              {zone === "NIGERIA" ? "🇳🇬" : zone === "AFRICA" ? "🌍" : "🌐"}
              {zone === "NIGERIA" ? "Nigeria" : zone === "AFRICA" ? "African Shipping" : "International Shipping"}
              {!zoneAvailable && <span className="ml-1 text-red-500">⚠ Not available for some items</span>}
            </div>
          )}

          {zone && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-700">Estimated Shipping Fee</span>
              <span className="text-sm font-bold text-primary-700">₦{shippingFee.toLocaleString()}</span>
            </div>
          )}

          {couriers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Select Courier *</label>
              <div className="grid grid-cols-2 gap-2">
                {couriers.map((c) => {
                  const etaInfo = zone ? getEtaForZone(zone, c) : null;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourier(c)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all",
                        courier === c
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <span className="text-sm font-semibold text-gray-800">{c}</span>
                      {etaInfo && <span className="text-xs text-gray-500 mt-0.5">{etaInfo.label}</span>}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="courierName" value={courier} />
            </div>
          )}
        </div>
      )}

      {/* ── Section: Payment ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-primary-500" /> Payment
        </h2>

        {/* Discount code input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary-500" /> Discount Code
          </label>
          {discountApplied ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-mono text-sm font-bold text-green-800">{discountApplied.code}</span>
              <span className="text-sm text-green-700">— ₦{discountApplied.amount.toLocaleString()} off</span>
              <button
                type="button"
                onClick={() => { setDiscountApplied(null); setDiscountInput(""); }}
                className="ml-auto"
              >
                <X className="w-4 h-4 text-green-600 hover:text-red-500 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(""); }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                placeholder="Enter code…"
                className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono uppercase outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
              <button
                type="button"
                onClick={applyDiscount}
                disabled={validatingDiscount || !discountInput.trim()}
                className="px-4 h-10 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {validatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          )}
          {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          💳 <strong>Coming soon:</strong> Card, bank transfer, USSD and wallet payments via Paystack. For now, orders are placed and held in escrow pending payment confirmation.
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform fee (5%)</span>
            <span className="font-semibold">₦{platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          {!isAllDigital && (
            <div className="flex justify-between text-gray-600">
              <span>Shipping ({zone ?? "—"})</span>
              <span className="font-semibold">{zone ? `₦${shippingFee.toLocaleString()}` : "—"}</span>
            </div>
          )}
          {isAllDigital && (
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold text-green-600">Free (Digital)</span>
            </div>
          )}
          {discountApplied && (
            <div className="flex justify-between text-green-700">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount ({discountApplied.code})</span>
              <span className="font-semibold">−₦{discountApplied.amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-primary-700">₦{Math.max(0, total).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (!isAllDigital && (!courier || !zoneAvailable))}
        className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
        ) : isAllDigital ? (
          "⚡ Place Order & Download"
        ) : (
          "Place Order"
        )}
      </button>
      <p className="text-center text-xs text-gray-400">
        By placing this order you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Buyer Protection Policy</span>.
      </p>
    </form>
  );
}
