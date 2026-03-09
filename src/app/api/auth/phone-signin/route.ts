/**
 * /api/auth/phone-signin
 *
 * Exchanges a one-time Redis token (created by verifyPhoneOtpAction)
 * for a real NextAuth session by calling signIn("phone-otp").
 */
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const next  = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=PhoneSessionExpired", req.url));
  }

  try {
    // The phone-otp provider in auth.ts validates the token against Redis
    await signIn("phone-otp", { token, redirectTo: next });
  } catch (err) {
    // Next.js redirect throws — re-throw it so the redirect fires
    throw err;
  }

  return NextResponse.redirect(new URL(next, req.url));
}

