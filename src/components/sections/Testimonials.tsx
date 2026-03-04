"use client";

import { motion, useAnimationFrame, useMotionValue, wrap } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS_LEFT = [
  {
    id: 1,
    name: "Sarah Thompson",
    handle: "@sarahsells",
    avatar: "ST",
    rating: 5,
    role: "buyer",
    text: "Bought a custom leather bag and it arrived in 5 days. The seller was amazing — communicated every step. Exhubb is now my go-to marketplace.",
    tag: "Buyer · Handmade Goods",
  },
  {
    id: 2,
    name: "Marcus Osei",
    handle: "@dev.marcus",
    avatar: "MO",
    rating: 5,
    role: "seller",
    text: "I quit my 9-to-5 after hitting $6,000/month on Exhubb offering web dev services. The platform actually promotes my profile to relevant buyers.",
    tag: "Seller · Web Dev Services",
  },
  {
    id: 3,
    name: "Priya Nair",
    handle: "@priya.designs",
    avatar: "PN",
    rating: 5,
    role: "seller",
    text: "Sold 340 logo designs in my first 8 months. The analytics dashboard is insane — I know exactly what's working and what to improve.",
    tag: "Seller · Logo Design",
  },
  {
    id: 4,
    name: "Tom Richards",
    handle: "@tomtechbuyer",
    avatar: "TR",
    rating: 5,
    role: "buyer",
    text: "Hired 3 different freelancers for my startup launch. Quality was consistently exceptional. The AI matching feature found exactly what I needed.",
    tag: "Buyer · Tech Services",
  },
  {
    id: 5,
    name: "Amara Diallo",
    handle: "@amaracrafts",
    avatar: "AD",
    rating: 5,
    role: "seller",
    text: "Shipping my Senegalese jewelry to 40+ countries now. The global reach is unreal. Payments land in my account within 3 days every time.",
    tag: "Seller · Handmade Jewelry",
  },
  {
    id: 6,
    name: "Jake Whitfield",
    handle: "@jakebuysthings",
    avatar: "JW",
    rating: 4,
    role: "buyer",
    text: "Best marketplace I've used. Customer support actually responded in under 2 hours when I had an issue. Fully resolved same day.",
    tag: "Buyer · Electronics",
  },
];

const TESTIMONIALS_RIGHT = [
  {
    id: 7,
    name: "Yuki Tanaka",
    handle: "@yukivoiceover",
    avatar: "YT",
    rating: 5,
    role: "seller",
    text: "As a voiceover artist, Exhubb gave me an audience I never had before. Completed over 800 orders. The review system builds so much trust.",
    tag: "Seller · Voice Acting",
  },
  {
    id: 8,
    name: "Chelsea Moore",
    handle: "@chelseashops",
    avatar: "CM",
    rating: 5,
    role: "buyer",
    text: "Found a vintage record collection I'd been searching for years. The seller verification process made me feel completely safe. 10/10.",
    tag: "Buyer · Collectibles",
  },
  {
    id: 9,
    name: "Roberto Lima",
    handle: "@roberto.codes",
    avatar: "RL",
    rating: 5,
    role: "seller",
    text: "From Brazil and I'm getting orders from US, UK, Australia daily. Exhubb is the first platform where geography actually doesn't matter.",
    tag: "Seller · Mobile Development",
  },
  {
    id: 10,
    name: "Fatima Al-Hassan",
    handle: "@fatima.creates",
    avatar: "FA",
    rating: 5,
    role: "seller",
    text: "Started with one service offering. Now I have 12 gigs, a 5-star rating, and a team of 3. Exhubb scaled with me every step.",
    tag: "Seller · Content Writing",
  },
  {
    id: 11,
    name: "Daniel Park",
    handle: "@danparkbuys",
    avatar: "DP",
    rating: 5,
    role: "buyer",
    text: "The escrow payment system is genius. Money only releases when I'm satisfied. That trust alone made me a loyal customer.",
    tag: "Buyer · Digital Art",
  },
  {
    id: 12,
    name: "Ingrid Svensson",
    handle: "@ingrid.studio",
    avatar: "IS",
    rating: 5,
    role: "seller",
    text: "UI/UX designer based in Stockholm. 60% of my annual income now comes from Exhubb. The quality of buyers is far above other platforms.",
    tag: "Seller · UI/UX Design",
  },
];

const CARD_BG: Record<string, string> = {
  buyer: "bg-white/[0.04] border-white/[0.08]",
  seller: "bg-primary-950/40 border-primary-800/20",
};

const AVATAR_BG = [
  "from-primary-700 to-primary-500",
  "from-gold-600 to-gold-400",
  "from-purple-700 to-purple-500",
  "from-rose-700 to-rose-500",
  "from-sky-700 to-sky-500",
  "from-orange-600 to-orange-400",
];

function TestimonialCard({ t, index }: { t: (typeof TESTIMONIALS_LEFT)[0]; index: number }) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      className={`relative rounded-2xl border p-5 ${CARD_BG[t.role]} backdrop-blur-sm mb-4 cursor-default select-none`}
    >
      <Quote className="absolute top-4 right-4 w-6 h-6 text-white/[0.08]" />
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_BG[index % AVATAR_BG.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {t.avatar}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-none truncate">{t.name}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{t.handle}</p>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="w-3 h-3 text-gold-400 fill-gold-400" />
          ))}
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">"{t.text}"</p>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.role === 'buyer' ? 'bg-sky-900/40 text-sky-400' : 'bg-primary-900/50 text-primary-400'}`}>
        {t.tag}
      </span>
    </motion.div>
  );
}

function ScrollColumn({ items, direction = 1 }: { items: typeof TESTIMONIALS_LEFT; direction?: 1 | -1 }) {
  const y = useMotionValue(0);
  const totalHeight = items.length * 240; // approx per card

  useAnimationFrame((_, delta) => {
    const speed = 0.045 * direction;
    const newY = y.get() + speed * delta;
    y.set(wrap(-totalHeight / 2, 0, newY));
  });

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden h-[600px] relative">
      <motion.div style={{ y }} className="will-change-transform">
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} t={t} index={i} />
        ))}
      </motion.div>
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gray-950 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="section-padding bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_50%,rgba(34,197,94,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-chip bg-gold-950/50 text-gold-400 border border-gold-800/30 mb-4 mx-auto w-fit"
          >
            Real Stories
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-lg text-white mb-3"
          >
            Trusted by Buyers &amp; Sellers<br />
            <span className="text-gradient-green">Around the World</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-lg mx-auto"
          >
            Join millions who have already discovered a smarter way to buy, sell, and grow.
          </motion.p>
        </div>

        {/* Dual-direction columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollColumn items={TESTIMONIALS_LEFT} direction={-1} />
          <ScrollColumn items={TESTIMONIALS_RIGHT} direction={1} />
        </div>
      </div>
    </section>
  );
}
