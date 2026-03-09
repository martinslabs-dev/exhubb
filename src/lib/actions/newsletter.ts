"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address.");

export async function subscribeNewsletterAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const raw = (formData.get("email") as string | null)?.trim() ?? "";

  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.toLowerCase();

  try {
    await prisma.newsletterSubscriber.upsert({
      where:  { email },
      update: {},        // already subscribed — no-op
      create: { email },
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  return { success: "You're subscribed! Check your inbox for updates." };
}
