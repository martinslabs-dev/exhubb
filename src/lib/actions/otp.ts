"use server";

import { prisma } from "@/lib/db";
import { verifyOtp, createOtp } from "@/lib/otp";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { otpRatelimit } from "@/lib/redis";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

interface ActionResult {
  error?: string;
  success?: string;
}

// ─── Verify email OTP ─────────────────────────────────────────
export async function verifyEmailAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = (formData.get("email") as string) ?? "";
  const code = ((formData.get("code") as string) ?? "").trim();

  if (!code || code.length !== 6) {
    return { error: "Enter the 6-digit code from your email." };
  }

  const result = await verifyOtp(email, code, "EMAIL_VERIFICATION");
  if (!result.success) return { error: result.error };

  // Mark email as verified + unlock account
  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerified: new Date(), isLocked: false, lockedUntil: null },
  });

  // Send welcome email
  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (user) await sendWelcomeEmail(email, user.name ?? "");

  // Sign in and redirect to dashboard
  try {
    await signIn("credentials", {
      email,
      // Can't re-sign-in with credentials without password — use redirect instead
      redirectTo: "/dashboard",
    });
  } catch {
    // Redirect directly (user will be auto-signed in after verification on next load)
  }

  redirect("/dashboard");
}

// ─── Resend verification OTP ─────────────────────────────────
export async function resendOtpAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const email = (formData.get("email") as string) ?? "";

  // Rate limit resend attempts
  const { success } = await otpRatelimit.limit(`${ip}:${email}`);
  if (!success) {
    return { error: "Too many resend attempts. Wait 10 minutes before trying again." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account found with this email." };
  if (user.emailVerified) return { success: "Your email is already verified. Sign in." };

  const code = await createOtp(user.id, email, "EMAIL_VERIFICATION");
  await sendVerificationEmail(email, user.name ?? "", code);
  return { success: "A new code has been sent to your email." };
}

// ─── Forgot password — send reset OTP ────────────────────────
export async function forgotPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();

  if (!email) return { error: "Enter your email address." };

  // Rate limit
  const { success } = await otpRatelimit.limit(`pw-reset:${ip}:${email}`);
  if (!success) return { error: "Too many attempts. Try again in 10 minutes." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid user enumeration
  if (user) {
    const code = await createOtp(user.id, email, "PASSWORD_RESET");
    await sendPasswordResetEmail(email, user.name ?? "", code);
  }

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

// ─── Reset password with OTP ─────────────────────────────────
export async function resetPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = (formData.get("email") as string) ?? "";
  const code = ((formData.get("code") as string) ?? "").trim();
  const password = (formData.get("password") as string) ?? "";

  const pwResult = z.string().min(8, "Password must be at least 8 characters").safeParse(password);
  if (!pwResult.success) return { error: pwResult.error.issues[0].message };

  const result = await verifyOtp(email, code, "PASSWORD_RESET");
  if (!result.success) return { error: result.error };

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: result.userId },
    data: { password: hashed, isLocked: false, lockedUntil: null },
  });

  redirect("/login?reset=1");
}
