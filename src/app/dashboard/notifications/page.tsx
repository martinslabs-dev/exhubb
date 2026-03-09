import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Bell,
  ShoppingBag,
  MessageSquare,
  Star,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  CheckCheck,
  Inbox,
} from "lucide-react";

export const metadata: Metadata = { title: "Notifications" };

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ORDER_PLACED:      { icon: ShoppingBag,   color: "text-blue-600",   bg: "bg-blue-50"   },
  ORDER_CONFIRMED:   { icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50"  },
  ORDER_SHIPPED:     { icon: Package,       color: "text-purple-600", bg: "bg-purple-50" },
  ORDER_DELIVERED:   { icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50"  },
  ORDER_COMPLETED:   { icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50"  },
  ORDER_CANCELLED:   { icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50"    },
  ORDER_DISPUTED:    { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  MESSAGE_RECEIVED:  { icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
  REVIEW_RECEIVED:   { icon: Star,          color: "text-amber-500",  bg: "bg-amber-50"  },
  PAYOUT_SENT:       { icon: DollarSign,    color: "text-green-600",  bg: "bg-green-50"  },
  SYSTEM:            { icon: Megaphone,     color: "text-gray-600",   bg: "bg-gray-100"  },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return "Just now";
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 7)    return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const params  = await searchParams;
  const filter  = params.filter ?? "all";

  const [allNotifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session!.user.id,
        ...(filter === "unread" && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId: session!.user.id, isRead: false },
    }),
  ]);

  const TABS = [
    { id: "all",    label: "All",    count: allNotifications.length },
    { id: "unread", label: "Unread", count: unreadCount             },
  ];

  // Group by date
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  function getGroup(date: Date): string {
    const d = new Date(date); d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime())     return "Today";
    if (d.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  const grouped = allNotifications.reduce((acc: Record<string, typeof allNotifications>, n) => {
    const g = getGroup(n.createdAt);
    if (!acc[g]) acc[g] = [];
    acc[g].push(n);
    return acc;
  }, {});

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto space-y-5">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? <><span className="font-bold text-primary-600">{unreadCount} unread</span> notification{unreadCount !== 1 ? "s" : ""}</>
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={async () => {
            "use server";
            await prisma.notification.updateMany({
              where: { userId: session!.user.id, isRead: false },
              data:  { isRead: true },
            });
          }}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        {TABS.map(({ id, label, count }) => (
          <Link
            key={id}
            href={`/dashboard/notifications?filter=${id}`}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              filter === id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
            {count > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-bold",
                filter === id ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
              )}>
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Notification list ─────────────────────────────── */}
      {allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            {filter === "unread"
              ? <CheckCheck className="w-9 h-9 text-green-300" />
              : <Inbox      className="w-9 h-9 text-gray-200"  />
            }
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            {filter === "unread"
              ? "You have no unread notifications."
              : "When you receive orders, messages, or updates, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{group}</p>
              <div className="space-y-1">
                {(items as any[]).map((notif: any) => {
                  const cfg  = NOTIF_CONFIG[notif.type] ?? NOTIF_CONFIG.SYSTEM;
                  const Icon = cfg.icon;

                  const inner = (
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all",
                        notif.isRead
                          ? "bg-white border border-gray-100 hover:border-gray-200"
                          : "bg-primary-50/60 border border-primary-100 hover:border-primary-200"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-4.5 h-4.5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm leading-snug", notif.isRead ? "font-medium text-gray-700" : "font-bold text-gray-900")}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                            )}
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {timeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                        {notif.body && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                        )}
                      </div>
                    </div>
                  );

                  return notif.link ? (
                    <Link key={notif.id} href={notif.link}>{inner}</Link>
                  ) : (
                    <div key={notif.id}>{inner}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Preferences link ──────────────────────────────── */}
      <div className="flex items-center justify-between py-4 px-5 bg-gray-50 rounded-2xl">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-400" />
          <p className="text-sm font-semibold text-gray-600">Notification preferences</p>
        </div>
        <Link
          href="/dashboard/settings/notifications"
          className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
