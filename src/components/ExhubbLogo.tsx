"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Brand colour tokens (match globals.css @theme) ───────────
// Primary green:  #16a34a (600) → #4ade80 (400)
// Accent  gold:   #ca8a04 (600) → #facc15 (400)

interface ExhubbLogoProps {
  /** "full" = icon + wordmark side by side (default)
   *  "stacked" = icon above wordmark
   *  "icon" = icon mark only */
  variant?: "full" | "stacked" | "icon";
  /** Icon height in px. Default 40. */
  size?: number;
  /** Extra className on the wrapper */
  className?: string;
  /** Dark background — flips wordmark to white */
  dark?: boolean;
  /** Disable entrance animation (e.g. in navbar on initial render) */
  noAnimate?: boolean;
}

export default function ExhubbLogo({
  variant = "full",
  size = 40,
  className,
  dark = false,
  noAnimate = false,
}: ExhubbLogoProps) {
  // ── "e" split concept ─────────────────────────────────────
  // 1. Draw a lowercase "e": a circle with a gap on the right
  //    and a crossbar at the vertical midpoint.
  // 2. Cut it exactly at the crossbar (y = CY).
  // 3. Top half shifts UP  → green gradient
  // 4. Bottom half shifts DOWN → gold gradient
  //
  // Viewport 100×100  |  circle centre (50,50)  |  R=34  |  stroke=12
  const R = 34, CX = 50, CY = 50, SW = 12;

  // Top half: from (CX+R, CY) counter-clockwise (large arc) to (CX-R, CY)
  // → traces the upper semicircle  (180°, going UP and over)
  const topPath = `M ${CX + R} ${CY} A ${R} ${R} 0 1 0 ${CX - R} ${CY}`;

  // Bottom half: from (CX-R, CY) clockwise (small arc) to the "e" opening
  // The opening sits ~20° above the equator on the right — this is the
  // characteristic gap of a lowercase "e".
  const openAngle = -20; // degrees above horizontal
  const ex = CX + R * Math.cos((openAngle * Math.PI) / 180);
  const ey = CY + R * Math.sin((openAngle * Math.PI) / 180);
  // CW from left (180°) → down → under → up+right → stop at 340° = 160° arc
  const botPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  // ── Motion variants ────────────────────────────────────────
  // Each half draws in (pathLength 0→1) while simultaneously drifting
  // to its final split position (y: 0 → ±SPLIT_GAP).
  const dur = noAnimate ? 0 : 0.7;
  const ease = [0.22, 1, 0.36, 1] as const;

  const topHalfV = {
    hidden: { pathLength: 0, opacity: 0, y: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      y: -6,
      transition: { duration: dur, ease, delay: 0 },
    },
  };

  const botHalfV = {
    hidden: { pathLength: 0, opacity: 0, y: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      y: 6,
      transition: { duration: dur, ease, delay: noAnimate ? 0 : 0.15 },
    },
  };

  const wordV = {
    hidden: { opacity: 0, x: -6 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: noAnimate ? 0 : 0.45,
        ease,
        delay: noAnimate ? 0 : 0.42,
      },
    },
  };

  const initial = noAnimate ? "visible" : "hidden";

  // ── Derived sizes ───────────────────────────────────────────
  const wmFontSize = Math.round(size * 0.5);
  const textColor = dark ? "#ffffff" : "#111827";

  // ── Icon SVG ────────────────────────────────────────────────
  const IconMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* Green gradient — primary brand */}
        <linearGradient id="ex-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#16a34a" /> {/* primary-600 */}
          <stop offset="100%" stopColor="#4ade80" /> {/* primary-400 */}
        </linearGradient>
        {/* Gold gradient — accent brand */}
        <linearGradient id="ex-gold" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ca8a04" /> {/* gold-600 */}
          <stop offset="100%" stopColor="#facc15" /> {/* gold-400 */}
        </linearGradient>
      </defs>

      {/* ── Top half of "e" — drifts UP — green ── */}
      <motion.path
        d={topPath}
        stroke="url(#ex-green)"
        strokeWidth={SW}
        strokeLinecap="round"
        fill="none"
        variants={topHalfV}
        initial={initial}
        animate="visible"
      />

      {/* ── Bottom half of "e" — drifts DOWN — gold ── */}
      <motion.path
        d={botPath}
        stroke="url(#ex-gold)"
        strokeWidth={SW}
        strokeLinecap="round"
        fill="none"
        variants={botHalfV}
        initial={initial}
        animate="visible"
      />
    </svg>
  );

  // ── Wordmark — Inter Black rendered as HTML span ────────────
  const WordmarkEl = (
    <motion.span
      variants={wordV}
      initial={initial}
      animate="visible"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: `${wmFontSize}px`,
        letterSpacing: "0.06em",
        lineHeight: 1,
        color: textColor,
        userSelect: "none",
      }}
    >
      EXHUBB
    </motion.span>
  );

  // ── Render ──────────────────────────────────────────────────
  // Icon removed for now — wordmark only across all variants
  return (
    <span className={cn("inline-flex items-center", className)}>
      {WordmarkEl}
    </span>
  );
}
