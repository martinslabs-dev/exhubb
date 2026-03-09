import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NotifPrefsForm from "./NotifPrefsForm";

export const metadata: Metadata = { title: "Notification Preferences | Exhubb" };

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Notification Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose when and how you want to be notified.
        </p>
      </div>
      <NotifPrefsForm />
    </div>
  );
}
