import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Route to the appropriate dashboard based on primary role
  // Priority: buyer is always available, so default to buyer
  redirect("/dashboard/buyer");
}
