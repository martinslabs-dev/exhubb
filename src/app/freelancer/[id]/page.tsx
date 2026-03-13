import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { BadgeCheck, MapPin, Star } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  if (!user) return { title: "Profile Not Found" };
  return { title: `${user.name ?? "Freelancer"} — Exhubb` };
}

export default async function FreelancerProfile({ params }: Props) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      location: true,
      isSellerVerified: true,
      isFreelancer: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const [gigs, completedOrders] = await Promise.all([
    prisma.gig.findMany({ where: { freelancerId: id, isActive: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.order.count({ where: { sellerId: id, status: "COMPLETED", gigId: { not: null } } }),
  ]);

  const memberSince = new Date(user.createdAt).getFullYear();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white border">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? "Freelancer"} width={112} height={112} className="object-cover w-full h-full" unoptimized={user.image.startsWith("/uploads/")} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-700 font-black text-2xl">{(user.name ?? "").split(" ").map(n => n[0]).slice(0,2).join("")}</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900">{user.name ?? "Freelancer"}</h1>
                {user.isSellerVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              {user.location && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {user.location}</p>}
              <p className="text-sm text-gray-600 mt-3 max-w-2xl">{user.bio}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">{gigs.length}</span>
              <span className="text-gray-500">Gigs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-900">{completedOrders}</span>
              <span className="text-gray-500">Completed orders</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">Member since {memberSince}</div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Services by {user.name ?? "this freelancer"} <span className="text-gray-400 font-normal text-sm">({gigs.length})</span></h2>

            {gigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-semibold">No active gigs</p>
                <p className="text-sm text-gray-400 mt-1">This freelancer hasn't published any services yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gigs.map((gig) => {
                  // Normalize coverImage which may be stored as a plain string, a JSON array string, or an object-like string
                  const normalize = (raw: any) => {
                    if (!raw) return null;
                    try {
                      if (typeof raw === "string") {
                        const s = raw.trim();
                        if (s.startsWith("[") && s.endsWith("]")) {
                          const parsed = JSON.parse(s);
                          if (Array.isArray(parsed) && parsed.length) return parsed[0];
                        }
                        if (s.startsWith("{") && s.endsWith("}")) {
                          const obj = JSON.parse(s);
                          if (obj && typeof obj === "object") return obj.url ?? obj.src ?? null;
                        }
                        return s || null;
                      }
                      if (typeof raw === "object") {
                        return raw.url ?? raw.src ?? null;
                      }
                      return null;
                    } catch (e) {
                      return null;
                    }
                  };
                  const imgSrc = normalize(gig.coverImage);

                  return (
                    <Link key={gig.id} href={`/gigs/${gig.id}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="aspect-video bg-gray-50 overflow-hidden">
                        {imgSrc ? (
                          <ImageWithFallback
                            src={imgSrc}
                            alt={gig.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-300">No image</div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{gig.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-sm font-black text-gray-900">₦{Math.round(gig.basicPrice).toLocaleString("en-NG")}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
