import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validations/auth";
import { redis } from "@/lib/redis";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,

  // JWT strategy is required when using Credentials provider
  session: { strategy: "jwt" },

  // ── Pages ──────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    error: "/login", // Auth errors redirect back to login with ?error=
  },

  // ── Providers ──────────────────────────────────────────────
  providers: [
    // ── Google ──────────────────────────────────────────────
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),

    // ── Facebook ────────────────────────────────────────────
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),

    // ── X (Twitter) ─────────────────────────────────────────
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),

    // ── Credentials (email + password) ───────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate shape with Zod
        const result = signInSchema.safeParse(credentials);
        if (!result.success) return null;

        const { email, password } = result.data;

        // 2. Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        // 3. Compare password (bcrypt, cost 12)
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 4. Return the user object — mapped into JWT by the jwt callback
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
          isBuyer: user.isBuyer,
          isSeller: user.isSeller,
          isFreelancer: user.isFreelancer,
        };
      },
    }),

    // ── Phone OTP (WhatsApp) ─────────────────────────────────
    Credentials({
      id:   "phone-otp",
      name: "Phone OTP",
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(credentials) {
        const token = (credentials?.token as string | undefined)?.trim();
        if (!token) return null;

        // Look up userId from Redis one-time token
        const userId = await redis.get<string>(`phone-signin:${token}`);
        if (!userId) return null;

        // Consume the token — single use
        await redis.del(`phone-signin:${token}`);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        return {
          id:            user.id,
          name:          user.name,
          email:         user.email,
          image:         user.image,
          emailVerified: user.emailVerified,
          isBuyer:       user.isBuyer,
          isSeller:      user.isSeller,
          isFreelancer:  user.isFreelancer,
        };
      },
    }),
  ],

  // ── Callbacks ──────────────────────────────────────────────
  callbacks: {
    // Stamp custom fields from DB onto the JWT token at sign-in only.
    // Do NOT call Prisma here — this callback runs on the Edge runtime
    // where PrismaClient is unavailable. Fresh roles are read in DashboardLayout.
    async jwt({ token, user }) {
      if (user) {
        token.id            = user.id;
        token.emailVerified = (user as any).emailVerified ?? null;
        token.isBuyer       = (user as any).isBuyer       ?? true;
        token.isSeller      = (user as any).isSeller      ?? false;
        token.isFreelancer  = (user as any).isFreelancer  ?? false;
      }
      return token;
    },

    // Expose token fields on the session object (accessible in components)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
        (session.user as any).isBuyer = token.isBuyer;
        (session.user as any).isSeller = token.isSeller;
        (session.user as any).isFreelancer = token.isFreelancer;
      }
      return session;
    },
  },
});
