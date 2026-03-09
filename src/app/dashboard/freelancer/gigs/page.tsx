import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Plus,
  Briefcase,
  Search,
  Filter,
  Edit2,
  Tag,
  Clock,
  TrendingUp,
  Star,
  ExternalLink,
} from "lucide-react";
import GigRowActions from "./GigRowActions";

export const metadata: Metadata = { title: "My Gigs" };

export default async function FreelancerGigsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  const params  = await searchParams;
  const q       = params.q      ?? "";
  const status  = params.status ?? "all";

  const gigs = await prisma.gig.findMany({
    where: {
      freelancerId: session!.user.id,
      ...(status === "active"   && { isActive: true  }),
      ...(status === "inactive" && { isActive: false }),
      ...(q && { title: { contains: q, mode: "insensitive" } }),
    },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalActive   = gigs.filter((g) => g.isActive).length;
  const totalInactive = gigs.filter((g) => !g.isActive).length;

  const TABS = [
    { id: "all",      label: "All",      count: gigs.length   },
    { id: "active",   label: "Active",   count: totalActive   },
    { id: "inactive", label: "Inactive", count: totalInactive },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Gigs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {gigs.length} gig{gigs.length !== 1 ? "s" : ""} · {totalActive} active
          </p>
        </div>
        <Link
          href="/dashboard/freelancer/gigs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          New Gig
        </Link>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Gigs",  value: gigs.length,   color: "text-gray-900"  },
          { label: "Active",      value: totalActive,   color: "text-green-600" },
          { label: "Inactive",    value: totalInactive, color: "text-gray-400"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className={cn("text-2xl font-black", color)}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ───────────────────────────────── */}
      <div className="flex gap-3">
        <form className="flex-1">
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search gigs…"
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
            <input type="hidden" name="status" value={status} />
          </div>
        </form>
        <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        {TABS.map(({ id, label, count }) => (
          <Link
            key={id}
            href={`/dashboard/freelancer/gigs?status=${id}${q ? `&q=${q}` : ""}`}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              status === id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-bold",
              status === id ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
            )}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Gig List ──────────────────────────────────────── */}
      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
            <Briefcase className="w-9 h-9 text-indigo-200" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">
            {q ? "No gigs match your search" : "No gigs yet"}
          </p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Create your first gig to start offering services on Exhubb.
          </p>
          <Link
            href="/dashboard/freelancer/gigs/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Gig
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all p-4 flex items-center gap-4"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex-shrink-0 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{gig.title}</p>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-gray-400">{gig.category}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{gig.deliveryDays}d delivery
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />{gig._count.orders} order{gig._count.orders !== 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    gig.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {gig.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {gig.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <Tag className="w-3 h-3 text-gray-300" />
                    {gig.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="text-right flex-shrink-0">
                <p className="text-base font-black text-gray-900">From ${gig.basicPrice.toFixed(2)}</p>
                {gig.standardPrice && (
                  <p className="text-xs text-gray-400 mt-0.5">Std ${gig.standardPrice.toFixed(2)}</p>
                )}
                <div className="flex items-center gap-0.5 justify-end mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-gray-400">New</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/dashboard/freelancer/gigs/${gig.id}/edit`}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                </Link>
                <GigRowActions gigId={gig.id} isActive={gig.isActive} />
                <Link
                  href={`/gigs/${gig.id}`}
                  target="_blank"
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="View live"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
