"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function activateRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = formData.get("role") as string;
  if (!["seller", "freelancer"].includes(role)) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { 
      ...(role === "seller"     && { isSeller:     true }),
      ...(role === "freelancer" && { isFreelancer: true }),
    },
  });

  redirect(`/dashboard/${role}`);
}
