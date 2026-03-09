import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "Exhubb <onboarding@resend.dev>";
const IS_DEV = process.env.NODE_ENV !== "production";

/** In dev, always print OTP codes to the terminal so you can test without email delivery. */
function devLog(label: string, to: string, code: string) {
  if (IS_DEV) {
    console.log(
      `\n📧 [${label} — Dev]\n` +
      `   To:   ${to}\n` +
      `   Code: ${code}\n` +
      `   (Set RESEND_FROM=noreply@yourdomain.com in .env.local to send to any address)\n`,
    );
  }
}

/** Shared send helper — logs Resend errors instead of silently dropping them. */
async function trySend(payload: Parameters<typeof resend.emails.send>[0]) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set — email not sent to:", payload.to);
    return;
  }
  const result = await resend.emails.send(payload);
  if (result.error) {
    console.error("[email] Resend error sending to", payload.to, ":", result.error);
  }
  return result;
}

// ─── Email Verification OTP ───────────────────────────────────
export async function sendVerificationEmail(email: string, name: string, code: string) {
  devLog("Email Verification OTP", email, code);
  if (!process.env.RESEND_API_KEY && IS_DEV) return; // skip Resend in dev if key absent
  return trySend({
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
  devLog("Password Reset OTP", email, code);
  if (!process.env.RESEND_API_KEY && IS_DEV) return;
  return trySend({
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

// ─── Order Confirmation (Buyer) ───────────────────────────────
export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderId: string,
  items: { title: string; qty: number; price: number }[],
  total: number,
) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;color:#111;font-size:14px;">${i.title}</td>` +
        `<td style="padding:8px 0;color:#555;font-size:14px;text-align:right;">x${i.qty}</td>` +
        `<td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;text-align:right;">₦${(i.price * i.qty).toLocaleString()}</td></tr>`,
    )
    .join("");

  return trySend({
    from: FROM,
    to,
    subject: "Order confirmed — Exhubb",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 4px;">Order confirmed ✓</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${name || "there"}, your order has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">${rows}</table>
        <p style="font-size:16px;font-weight:800;color:#111;border-top:2px solid #f4f4f5;padding-top:12px;margin:0 0 24px;">
          Total: <span style="color:#16a34a;">₦${total.toLocaleString()}</span>
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/buyer/orders/${orderId}"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          Track your order
        </a>
      </div>
    `,
  });
}

// ─── New Order Alert (Seller) ─────────────────────────────────
export async function sendSellerNewOrderEmail(
  to: string,
  sellerName: string,
  orderId: string,
  productTitle: string,
  amount: number,
) {
  return trySend({
    from: FROM,
    to,
    subject: "New order received — Exhubb",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 4px;">New order 🎉</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${sellerName || "there"}, you just received a new order.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#555;">Product</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#111;">${productTitle}</p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:900;color:#16a34a;">₦${amount.toLocaleString()}</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/seller/orders/${orderId}"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          Process order
        </a>
      </div>
    `,
  });
}

// ─── Order Shipped (Buyer) ────────────────────────────────────
export async function sendOrderShippedEmail(
  to: string,
  name: string,
  orderId: string,
  trackingNumber: string,
  courier: string,
) {
  return trySend({
    from: FROM,
    to,
    subject: "Your order has shipped — Exhubb",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 4px;">Your order is on the way 📦</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${name || "there"}, your order has been shipped!</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:13px;color:#888;">Courier</p>
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111;">${courier || "Carrier"}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#888;">Tracking number</p>
          <p style="margin:0;font-size:16px;font-weight:900;color:#111;letter-spacing:1px;">${trackingNumber || "—"}</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/buyer/orders/${orderId}"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          Track delivery
        </a>
      </div>
    `,
  });
}

// ─── Welcome Email ────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  return trySend({
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
