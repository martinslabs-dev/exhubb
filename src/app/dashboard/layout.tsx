import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: { template: "%s · Exhubb Dashboard", default: "Dashboard · Exhubb" },
  description: "Your Exhubb account dashboard.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Always read fresh from DB — roles, name, image and unread counts
  const [dbUser, unreadMessages, unreadNotifications] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, image: true, isBuyer: true, isSeller: true, isFreelancer: true, storeSlug: true },
    }),
    prisma.message.count({
      where: { conversation: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] }, senderId: { not: session.user.id }, isRead: false },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  const user = {
    id:           session.user.id,
    name:         dbUser?.name         ?? session.user.name  ?? null,
    email:        session.user.email   ?? null,
    image:        dbUser?.image        ?? session.user.image ?? null,
    isBuyer:      dbUser?.isBuyer      ?? true,
    isSeller:     dbUser?.isSeller     ?? false,
    isFreelancer: dbUser?.isFreelancer ?? false,
    storeSlug:    dbUser?.storeSlug    ?? null,
  };

  return (
    <DashboardShell user={user} unreadMessages={unreadMessages} unreadNotifications={unreadNotifications}>
      {children}
    </DashboardShell>
  );
}
