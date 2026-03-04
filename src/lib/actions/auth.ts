"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signUpSchema, signInSchema } from "@/lib/validations/auth";
import { loginRatelimit, registerRatelimit } from "@/lib/redis";
import { createOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";
import { headers } from "next/headers";

// ─── Types ────────────────────────────────────────────────────
interface ActionResult {
  error?: string;
  success?: string;
}

// ─── signUpAction ─────────────────────────────────────────────
export async function signUpAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  // 1. Rate limit by IP
  const { success: notRateLimited } = await registerRatelimit.limit(ip);
  if (!notRateLimited) {
    return { error: "Too many registrations from this network. Try again in 1 hour." };
  }

  // 2. Zod validation
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    intent: formData.get("intent") ?? "buyer",
  };
  const result = signUpSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }
  const { name, email, password, intent } = result.data;

  // 4. Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  // 5. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 6. Create user (emailVerified is null → unverified)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isBuyer: true,
      isSeller: intent === "seller",
      isFreelancer: intent === "freelancer",
    },
  });

  // 7. Generate OTP and send verification email
  const code = await createOtp(user.id, email, "EMAIL_VERIFICATION");
  await sendVerificationEmail(email, name ?? "", code);

  // 8. Redirect to verify-email page — don't sign in yet
  // Store email in cookie via search param so verify page knows who to verify
  const { redirect } = await import("next/navigation");
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);

  return {}; // unreachable
}

// ─── signInAction ─────────────────────────────────────────────
export async function signInAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const email = (formData.get("email") as string) ?? "";

  // 1. Rate limit by IP + email combined
  const { success: notRateLimited, remaining } = await loginRatelimit.limit(`${ip}:${email}`);
  if (!notRateLimited) {
    return { error: "Too many login attempts. Try again in 15 minutes." };
  }

  // 2. Zod validation
  const result = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // 4. Check if user is temporarily locked
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Account temporarily locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.` };
  }

  // 5. Check email is verified
  if (user && !user.emailVerified) {
    // Resend OTP
    const code = await createOtp(user.id, email, "EMAIL_VERIFICATION");
    await sendVerificationEmail(email, user.name ?? "", code);
    const { redirect } = await import("next/navigation");
    redirect(`/verify-email?email=${encodeURIComponent(email)}&resent=1`);
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Lock account after only 1 remaining attempt
      if (remaining <= 1 && user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isLocked: true, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
        });
      }
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: `Incorrect email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
          };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error; // re-throw NEXT_REDIRECT
  }

  return {};
}

// ─── signOutAction ────────────────────────────────────────────
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
