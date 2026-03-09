import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { OtpType } from "@prisma/client";

const OTP_EXPIRY_MINUTES = 15;

// ─── Generate a 6-digit OTP, store hashed in DB ───────────────
export async function createOtp(userId: string, email: string, type: OtpType): Promise<string> {
  // Invalidate any previous unused tokens of same type
  await prisma.otpToken.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: { userId, email, code: hashed, type, expiresAt },
  });

  return code; // return plaintext to send via email
}

// ─── Generate a 6-digit OTP for phone (WhatsApp) ─────────────
export async function createPhoneOtp(userId: string, phone: string): Promise<string> {
  await prisma.otpToken.updateMany({
    where: { userId, type: "PHONE_VERIFICATION", used: false },
    data:  { used: true },
  });

  const code      = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed    = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      userId,
      email:  `phone:${phone}`, // placeholder — phone stored in phone field
      phone,
      code:   hashed,
      type:   "PHONE_VERIFICATION",
      expiresAt,
    },
  });

  return code;
}

// ─── Verify a phone OTP code ──────────────────────────────────
export async function verifyPhoneOtp(
  phone: string,
  code:  string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const token = await prisma.otpToken.findFirst({
    where:   { phone, type: "PHONE_VERIFICATION", used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return { success: false, error: "Invalid or expired code." };
  if (token.expiresAt < new Date()) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
    return { success: false, error: "Code has expired. Request a new one." };
  }

  const valid = await bcrypt.compare(code, token.code);
  if (!valid) return { success: false, error: "Incorrect code. Please try again." };

  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
  return { success: true, userId: token.userId };
}

// ─── Verify an OTP code ───────────────────────────────────────
export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const token = await prisma.otpToken.findFirst({
    where: { email, type, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return { success: false, error: "Invalid or expired code." };
  if (token.expiresAt < new Date()) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
    return { success: false, error: "Code has expired. Request a new one." };
  }

  const valid = await bcrypt.compare(code, token.code);
  if (!valid) return { success: false, error: "Incorrect code. Please try again." };

  // Mark as used
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });

  return { success: true, userId: token.userId };
}
