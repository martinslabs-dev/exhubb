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
export interface ActionResult {
  error?: string;
  success?: string;
  field?: string;        // which input triggered the error (for inline highlight)
  lockedUntil?: number;  // ms timestamp — enables client countdown timer
}

// ─── signUpAction ─────────────────────────────────────────────
export async function signUpAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  // 1. Rate limit by IP
  try {
    const { success: notRateLimited } = await registerRatelimit.limit(ip);
    if (!notRateLimited) {
      return { error: "Too many registrations from this network. Try again in 1 hour." };
    }
  } catch {
    // Redis down — skip rate limit in dev, block in prod
    if (process.env.NODE_ENV === "production") {
      return { error: "Service temporarily unavailable. Please try again." };
    }
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

  let redirectUrl: string;

  try {
    // 4. Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists. Sign in instead.", field: "email" };
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

    redirectUrl = `/verify-email?email=${encodeURIComponent(email)}`;
  } catch (err) {
    console.error("[signUpAction]", err);
    return { error: "Could not create your account. Please try again in a moment." };
  }

  // 8. Redirect outside try/catch so NEXT_REDIRECT propagates
  const { redirect } = await import("next/navigation");
  redirect(redirectUrl);

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
  let remaining = 5;
  try {
    const rl = await loginRatelimit.limit(`${ip}:${email}`);
    if (!rl.success) {
      return { error: "Too many login attempts. Try again in 15 minutes." };
    }
    remaining = rl.remaining;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { error: "Service temporarily unavailable. Please try again." };
    }
  }

  // 2. Zod validation
  const result = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // 3. Check lock status + email verification
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    console.error("[signInAction] DB lookup failed", err);
    return { error: "Could not reach the database. Please try again in a moment." };
  }

  if (user?.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "account-locked", lockedUntil: user.lockedUntil.getTime() };
  }

  // 4. Check email is verified
  if (user && !user.emailVerified) {
    try {
      const code = await createOtp(user.id, email, "EMAIL_VERIFICATION");
      await sendVerificationEmail(email, user.name ?? "", code);
    } catch { /* best-effort — log handled inside */ }
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
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { isLocked: true, lockedUntil: new Date(Date.now() + 5 * 60 * 1000) },
          });
        } catch { /* non-critical */ }
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
