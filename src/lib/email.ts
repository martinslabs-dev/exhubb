import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Exhubb <onboarding@resend.dev>"; // swap to noreply@exhubb.com once domain is verified in Resend

// ─── Email Verification OTP ───────────────────────────────────
export async function sendVerificationEmail(email: string, name: string, code: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Exhubb verification code",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:24px;font-weight:900;color:#111;margin:0 0 8px;">Verify your email</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${name || "there"}, enter this code to verify your Exhubb account:</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#16a34a;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">This code expires in <strong>15 minutes</strong>. If you didn't create an Exhubb account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// ─── Password Reset OTP ───────────────────────────────────────
export async function sendPasswordResetEmail(email: string, name: string, code: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Exhubb password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:24px;font-weight:900;color:#111;margin:0 0 8px;">Password reset</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${name || "there"}, use this code to reset your Exhubb password:</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#ca8a04;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">This code expires in <strong>15 minutes</strong>. If you didn't request a password reset, please secure your account immediately.</p>
      </div>
    `,
  });
}

// ─── Welcome Email ────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Exhubb 🎉",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:24px;font-weight:900;color:#111;margin:0 0 8px;">Welcome, ${name || "friend"}!</h1>
        <p style="color:#555;font-size:15px;margin:0 0 16px;">Your Exhubb account is verified and ready. You can now buy, sell, freelance and hire — all in one place.</p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:15px;">Go to dashboard</a>
      </div>
    `,
  });
}
