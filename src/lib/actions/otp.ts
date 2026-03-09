"use server";

import { prisma } from "@/lib/db";
import { verifyOtp, createOtp, createPhoneOtp, verifyPhoneOtp } from "@/lib/otp";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { sendWhatsAppOtp } from "@/lib/whatsapp";
import { otpRatelimit, redis } from "@/lib/redis";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
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

  let userId: string;

  try {
    const result = await verifyOtp(email, code, "EMAIL_VERIFICATION");
    if (!result.success) return { error: result.error };

    userId = result.userId!;

    // Mark email as verified + unlock account
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date(), isLocked: false, lockedUntil: null },
    });

    // Send welcome email (best-effort)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) await sendWelcomeEmail(email, user.name ?? "");
  } catch (err) {
    console.error("[verifyEmailAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }

  // Auto sign-in via phone-otp provider (requires Redis).
  // If Redis is unavailable, fall back to redirecting to /login?verified=1 instead.
  try {
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    await redis.set(`phone-signin:${token}`, userId, { ex: 300 });
    await signIn("phone-otp", { token, redirectTo: "/add-phone" });
  } catch (err: any) {
    // Re-throw NEXT_REDIRECT so successful signIn redirects propagate
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    // Redis or signIn failed — fall back to manual login
    console.error("[verifyEmailAction] Auto sign-in failed, falling back:", err);
  }
  // Fallback: email is verified but auto sign-in failed — send to login
  redirect("/login?verified=1");
  return {}; // unreachable
}

// ─── Resend verification OTP ─────────────────────────────────
export async function resendOtpAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "unknown";
    const email = (formData.get("email") as string) ?? "";

    try {
      const { success } = await otpRatelimit.limit(`${ip}:${email}`);
      if (!success) {
        return { error: "Too many resend attempts. Wait 10 minutes before trying again." };
      }
    } catch (e) {
      console.warn("[resendOtpAction] Rate limiter unavailable, skipping:", e);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "No account found with this email." };
    if (user.emailVerified) return { success: "Your email is already verified. Sign in." };

    const code = await createOtp(user.id, email, "EMAIL_VERIFICATION");
    await sendVerificationEmail(email, user.name ?? "", code);
    return { success: "A new code has been sent to your email." };
  } catch (err) {
    console.error("[resendOtpAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }
}

// ─── Forgot password — send reset OTP ────────────────────────
export async function forgotPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  if (!email) return { error: "Enter your email address." };

  let redirectTo: string;
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "unknown";

    const { success } = await otpRatelimit.limit(`pw-reset:${ip}:${email}`);
    if (!success) return { error: "Too many attempts. Try again in 10 minutes." };

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to avoid user enumeration
    if (user) {
      const code = await createOtp(user.id, email, "PASSWORD_RESET");
      await sendPasswordResetEmail(email, user.name ?? "", code);
    }
    redirectTo = `/reset-password?email=${encodeURIComponent(email)}`;
  } catch (err) {
    console.error("[forgotPasswordAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }

  redirect(redirectTo);
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

// ─── Send phone (WhatsApp) OTP ────────────────────────────────
export async function sendPhoneOtpAction(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const phone   = ((formData.get("phone")  as string) ?? "").trim();
  const name    = ((formData.get("name")   as string) ?? "").trim();
  const intent  = ((formData.get("intent") as string) ?? "buyer").trim();
  const isLogin = formData.get("isLogin") === "1";

  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
    return { error: "Enter a valid phone number including country code (e.g. +2348012345678)." };
  }

  let redirectTo: string;
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "unknown";

    try {
      const { success } = await otpRatelimit.limit(`phone-otp:${ip}:${phone}`);
      if (!success) return { error: "Too many attempts. Try again in 10 minutes." };
    } catch (e) {
      console.warn("[sendPhoneOtpAction] Rate limiter unavailable, skipping:", e);
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (isLogin) {
      // Login flow — don't reveal whether account exists
      if (user) {
        const code = await createPhoneOtp(user.id, phone);
        try { await sendWhatsAppOtp(phone, code); } catch { /* logged inside */ }
      }
    } else {
      // Register flow
      if (!name) return { error: "Name is required." };
      if (user) return { error: "An account with this phone already exists. Sign in instead." };

      user = await prisma.user.create({
        data: {
          name,
          phone,
          isBuyer:      true,
          isSeller:     intent === "seller",
          isFreelancer: intent === "freelancer",
        },
      });
      const code = await createPhoneOtp(user.id, phone);
      try { await sendWhatsAppOtp(phone, code); } catch { /* logged inside */ }
    }

    redirectTo = `/verify-phone?phone=${encodeURIComponent(phone)}&login=${isLogin ? "1" : "0"}`;
  } catch (err) {
    console.error("[sendPhoneOtpAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }

  redirect(redirectTo);
}

// ─── Verify phone (WhatsApp) OTP ──────────────────────────────
export async function verifyPhoneOtpAction(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const code  = ((formData.get("code")  as string) ?? "").trim();
  const mode  = ((formData.get("mode")  as string) ?? "").trim(); // "add" = already signed in

  if (!code || code.length !== 6) {
    return { error: "Enter the 6-digit code sent to your WhatsApp." };
  }

  let redirectTo: string;

  try {
    const result = await verifyPhoneOtp(phone, code);
    if (!result.success) return { error: result.error };

    // Mark phone as verified
    await prisma.user.update({
      where: { id: result.userId },
      data:  { phoneVerified: true, isLocked: false, lockedUntil: null },
    });

    if (mode === "add") {
      redirectTo = "/dashboard?phone=verified";
    } else {
      // Sign in directly from the Server Action (correct NextAuth v5 pattern)
      try {
        const { randomBytes } = await import("crypto");
        const token = randomBytes(32).toString("hex");
        await redis.set(`phone-signin:${token}`, result.userId!, { ex: 90 });
        redirectTo = `__phone_signin__:${token}`;
      } catch (redisErr) {
        console.warn("[verifyPhoneOtpAction] Redis unavailable, falling back to login:", redisErr);
        redirectTo = "/login?verified=1";
      }
    }
  } catch (err) {
    console.error("[verifyPhoneOtpAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }

  // Phone sign-in: call signIn directly from the Server Action
  if (redirectTo.startsWith("__phone_signin__:")) {
    const token = redirectTo.replace("__phone_signin__:", "");
    await signIn("phone-otp", { token, redirectTo: "/dashboard" });
    return {}; // unreachable — signIn always redirects
  }

  redirect(redirectTo);
}

// ─── Add phone to existing account ───────────────────────────
// Used on /add-phone after email verification (user is already signed in).
export async function addPhoneAction(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let redirectTo: string;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Session expired. Please sign in again." };
    }

    const headersList = await headers();
    const ip    = headersList.get("x-forwarded-for") ?? "unknown";
    const phone = ((formData.get("phone") as string) ?? "").trim();

    if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
      return { error: "Enter a valid phone number with country code, e.g. +2348012345678" };
    }

    try {
      const { success } = await otpRatelimit.limit(`add-phone:${ip}:${session.user.id}`);
      if (!success) return { error: "Too many attempts. Try again in 10 minutes." };
    } catch (e) {
      console.warn("[addPhoneAction] Rate limiter unavailable, skipping:", e);
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== session.user.id) {
      return { error: "This number is already linked to another account." };
    }

    await prisma.user.update({ where: { id: session.user.id }, data: { phone } });

    const code = await createPhoneOtp(session.user.id, phone);
    try { await sendWhatsAppOtp(phone, code); } catch { /* logged inside */ }

    redirectTo = `/verify-phone?phone=${encodeURIComponent(phone)}&mode=add`;
  } catch (err) {
    console.error("[addPhoneAction]", err);
    return { error: "Something went wrong. Please try again in a moment." };
  }

  redirect(redirectTo);
}
