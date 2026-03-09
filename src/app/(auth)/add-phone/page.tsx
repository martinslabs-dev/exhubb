"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, ArrowRight, AlertCircle, Smartphone, Globe } from "lucide-react";
import { addPhoneAction } from "@/lib/actions/otp";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};
const shakeVariants: Variants = {
  shake: { x: [0, -10, 10, -8, 8, -4, 0], transition: { duration: 0.45 } },
};

const COUNTRY_CODES = [
  { flag: "🇳🇬", code: "+234", label: "Nigeria"    },
  { flag: "🇺🇸", code: "+1",   label: "USA/Canada" },
  { flag: "🇬🇧", code: "+44",  label: "UK"         },
  { flag: "🇬🇭", code: "+233", label: "Ghana"      },
  { flag: "🇿🇦", code: "+27",  label: "S. Africa"  },
  { flag: "🇰🇪", code: "+254", label: "Kenya"      },
  { flag: "🇮🇳", code: "+91",  label: "India"      },
  { flag: "🇦🇺", code: "+61",  label: "Australia"  },
  { flag: "🇩🇪", code: "+49",  label: "Germany"    },
  { flag: "🇫🇷", code: "+33",  label: "France"     },
  { flag: "🇧🇷", code: "+55",  label: "Brazil"     },
  { flag: "🇨🇦", code: "+1",   label: "Canada"     },
  { flag: "🇦🇪", code: "+971", label: "UAE"        },
  { flag: "🇸🇦", code: "+966", label: "Saudi Arabia"},
  { flag: "🌍", code: "other", label: "Other..."   },
];

function AddPhoneForm() {
  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [focused,     setFocused]     = useState(false);
  const fullPhone = `${countryCode}${phoneNumber.replace(/\s+/g, "").replace(/^0/, "")}`;

  const [state, formAction, isPending] = useActionState(addPhoneAction, null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Icon */}
      <motion.div
        variants={itemVariants}
        className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5"
      >
        <Smartphone className="w-7 h-7 text-green-600" />
      </motion.div>

      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Add your WhatsApp number
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          Get instant transaction alerts, OTP codes and important updates directly on WhatsApp.
          You can skip this and add it later from your profile.
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {state?.error && (
          <motion.div
            key="err"
            variants={shakeVariants}
            animate="shake"
            initial={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form action={formAction} className="space-y-4">
        {/* Combined phone hidden field */}
        <input type="hidden" name="phone" value={fullPhone} />

        {/* Phone input */}
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            WhatsApp phone number
          </label>
          <div className={`flex rounded-xl border-2 overflow-hidden transition-colors duration-150 ${
            focused ? "border-primary-500 shadow-sm shadow-primary-100" : "border-gray-200"
          }`}>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-12 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 outline-none shrink-0 cursor-pointer"
            >
              {COUNTRY_CODES.map(({ flag, code, label }) => (
                <option key={`${code}-${label}`} value={code}>
                  {flag} {code} ({label})
                </option>
              ))}
            </select>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="800 000 0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
              className="flex-1 h-12 px-4 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            Enter the number you use for WhatsApp, without the leading zero
          </p>
        </motion.div>

        {/* Preview */}
        <AnimatePresence>
          {phoneNumber && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium">
                We&apos;ll send your OTP to <span className="font-bold">{fullPhone}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div variants={itemVariants} className="pt-1">
          <motion.button
            type="submit"
            disabled={isPending || phoneNumber.length < 5}
            whileHover={{ scale: isPending || phoneNumber.length < 5 ? 1 : 1.015 }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Send verification code <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Skip */}
      <motion.div variants={itemVariants} className="mt-5 text-center">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Skip for now — I&apos;ll add it later
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function AddPhonePage() {
  return (
    <Suspense>
      <AddPhoneForm />
    </Suspense>
  );
}
