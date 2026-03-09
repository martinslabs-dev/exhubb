import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Edit Profile | Exhubb" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true, bio: true, location: true, website: true, image: true },
  });

  if (!user) redirect("/auth/login");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          This information is visible to buyers, sellers, and freelancers you interact with.
        </p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
