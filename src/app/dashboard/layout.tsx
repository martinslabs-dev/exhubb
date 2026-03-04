import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
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

  const user = {
    id:           session.user.id,
    name:         session.user.name  ?? null,
    email:        session.user.email ?? null,
    image:        session.user.image ?? null,
    isBuyer:      (session.user as any).isBuyer      ?? true,
    isSeller:     (session.user as any).isSeller     ?? false,
    isFreelancer: (session.user as any).isFreelancer ?? false,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
