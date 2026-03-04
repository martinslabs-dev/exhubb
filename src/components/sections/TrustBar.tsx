"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { ShieldCheck, Globe, Star, Package, Users, Award } from "lucide-react";
import {
  siGithub, siGoogle, siShopify, siStripe, siFigma,
  siVercel, siNotion, siSpotify, siZoom, siHubspot,
} from "simple-icons";

const stats = [
  { value: 2.4,  suffix: "M+",  label: "Active Users",      icon: <Users     className="w-5 h-5" />, color: "text-primary-600" },
  { value: 18,   suffix: "M+",  label: "Listings",          icon: <Package   className="w-5 h-5" />, color: "text-gold-600"    },
  { value: 160,  suffix: "+",   label: "Countries",         icon: <Globe     className="w-5 h-5" />, color: "text-primary-600" },
  { value: 4.9,  suffix: "",    label: "Avg. Rating",       icon: <Star      className="w-5 h-5" />, color: "text-gold-600"    },
  { value: 98,   suffix: "%",   label: "Satisfaction",      icon: <Award     className="w-5 h-5" />, color: "text-primary-600" },
  { value: 100,  suffix: "%",   label: "Secure Payments",   icon: <ShieldCheck className="w-5 h-5" />, color: "text-gold-600"  },
];

/* ─── Brand logos via simple-icons (correct paths, uniform 24×24 viewBox) ─ */
const brands = [
  { si: siGithub,  name: "GitHub"  },
  { si: siGoogle,  name: "Google"  },
  { si: siShopify, name: "Shopify" },
  { si: siStripe,  name: "Stripe"  },
  { si: siFigma,   name: "Figma"   },
  { si: siVercel,  name: "Vercel"  },
  { si: siNotion,  name: "Notion"  },
  { si: siSpotify, name: "Spotify" },
  { si: siZoom,    name: "Zoom"    },
  { si: siHubspot, name: "HubSpot" },
];



export default function TrustBar() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white border-y border-gray-100 overflow-hidden">
      {/* Stats row */}
      <div ref={ref} className="container-wide py-10 md:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center gap-1.5 group"
            >
              <div className={`${s.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                {s.icon}
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                  {inView ? (
                    <CountUp
                      end={s.value}
                      duration={1.8}
                      delay={0.2 + i * 0.08}
                      decimals={s.value % 1 !== 0 ? 1 : 0}
                      separator=","
                    />
                  ) : "0"}
                </span>
                <span className="text-xl font-black text-primary-600">{s.suffix}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-8" />

      {/* Brand marquee */}
      <div className="py-6">
        <p className="text-center text-xs font-semibold tracking-widest text-gray-400 uppercase mb-5">
          Trusted by teams at
        </p>
        <div className="marquee-container">
          <div className="marquee-track">
            {[...brands, ...brands].map(({ si, name }, i) => (
              <div
                key={`${i}-${name}`}
                title={name}
                aria-hidden={i >= brands.length}
                className="flex items-center justify-center px-10 opacity-[0.22] hover:opacity-60 hover:scale-110 transition-[opacity,transform] duration-300 ease-out cursor-default select-none shrink-0"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 fill-current text-gray-700"
                  aria-label={name}
                >
                  <path d={si.path} />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
