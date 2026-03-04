"use client";

import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageCircle, CheckCircle2,
  Store, Bell, Banknote, ShoppingCart,
  ClipboardList, Users, BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { cn, spring } from "@/lib/utils";

const ROLES = ["Buyer", "Hire", "Seller"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  Buyer: "As a Buyer",
  Hire:  "Hire Talent",
  Seller: "As a Seller",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  Buyer:  <ShoppingCart className="w-4 h-4" />,
  Hire:   <Users        className="w-4 h-4" />,
  Seller: <Store        className="w-4 h-4" />,
};

const STEP_ICON_MAP: Record<string, LucideIcon> = {
  Search, MessageCircle, CheckCircle2, Store, Bell, Banknote,
  ClipboardList, Users, BadgeCheck,
};

const steps: Record<Role, { step: string; icon: string; title: string; desc: string; highlight: string }[]> = {
  Buyer: [
    {
      step: "01",
      icon: "Search",
      title: "Search & Discover",
      desc: "Use our AI-powered search to find exactly what you need — products or services — from millions of listings across 160+ countries.",
      highlight: "AI-Powered Search",
    },
    {
      step: "02",
      icon: "MessageCircle",
      title: "Connect & Order",
      desc: "Message sellers, review portfolios and ratings, then place your order with full escrow protection. Pay only once you're satisfied.",
      highlight: "Escrow Protection",
    },
    {
      step: "03",
      icon: "CheckCircle2",
      title: "Receive & Review",
      desc: "Get your product delivered or service completed. Review your experience to help the community and build trust.",
      highlight: "Guaranteed Delivery",
    },
  ],
  Hire: [
    {
      step: "01",
      icon: "ClipboardList",
      title: "Post a Brief",
      desc: "Describe your project, budget, and deadline — or browse freelancer profiles directly. Our AI instantly matches you with the right talent.",
      highlight: "AI Talent Matching",
    },
    {
      step: "02",
      icon: "Users",
      title: "Review & Connect",
      desc: "Compare proposals, portfolios, and reviews. Message shortlisted freelancers to align on scope, timeline, and deliverables before committing.",
      highlight: "No Commitment Required",
    },
    {
      step: "03",
      icon: "BadgeCheck",
      title: "Approve & Pay Safely",
      desc: "Funds are held in escrow and only released when you're 100% satisfied with the delivery. Raise a dispute anytime — we've got your back.",
      highlight: "Escrow Protected",
    },
  ],
  Seller: [
    {
      step: "01",
      icon: "Store",
      title: "Create Your Profile",
      desc: "List products for sale or offer your skills as services — completely free. Set up your store in under 5 minutes with our AI listing assistant.",
      highlight: "Free to List",
    },
    {
      step: "02",
      icon: "Bell",
      title: "Receive Orders",
      desc: "Get real-time notifications for new orders. Communicate with buyers in-app, manage deliveries, and track your performance dashboard.",
      highlight: "Real-Time Dashboard",
    },
    {
      step: "03",
      icon: "Banknote",
      title: "Get Paid Globally",
      desc: "Withdraw your earnings to your bank, PayPal, or crypto wallet. We support 50+ payout methods across 160+ countries via Stripe Connect.",
      highlight: "160+ Countries",
    },
  ],
};

export default function HowItWorks() {
  const [role, setRole] = useState<Role>("Buyer");

  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-chip bg-primary-100 text-primary-700 mb-3 mx-auto w-fit"
          >
            Simple. Fast. Trusted.
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-lg text-gray-900 mb-3"
          >
            How Exhubb Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-lg mx-auto"
          >
            Whether you&apos;re buying products, hiring talent, or selling your skills — it&apos;s always three simple steps.
          </motion.p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  role === r ? "text-white" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {role === r && (
                  <motion.div
                    layoutId="role-bg"
                    transition={spring.smooth}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-md"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {ROLE_ICONS[r]}
                  {ROLE_LABELS[r]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6 relative"
          >
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.6%+24px)] right-[calc(16.6%+24px)] h-px">
              <div className="w-full h-full border-t-2 border-dashed border-primary-200" />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full border-t-2 border-primary-500 origin-left"
              />
            </div>

            {steps[role].map((step, i) => {
              const StepIcon = STEP_ICON_MAP[step.icon];
              return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                style={{ willChange: "transform" }}
                className="group relative flex flex-col items-center text-center p-7 bg-white rounded-3xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all"
              >
                {/* Step number */}
                <div className="relative mb-5">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:shadow-primary-300 transition-shadow"
                  >
                    <StepIcon className="w-6 h-6" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{step.desc}</p>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  <CheckCircle2 className="w-3 h-3" />
                  {step.highlight}
                </span>
              </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
