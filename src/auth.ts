import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

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
          isBuyer: user.isBuyer,
          isSeller: user.isSeller,
          isFreelancer: user.isFreelancer,
        };
      },
    }),
  ],

  // ── Callbacks ──────────────────────────────────────────────
  callbacks: {
    // Stamp custom fields from DB onto the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isBuyer = (user as any).isBuyer ?? true;
        token.isSeller = (user as any).isSeller ?? false;
        token.isFreelancer = (user as any).isFreelancer ?? false;
      }
      return token;
    },

    // Expose token fields on the session object (accessible in components)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).isBuyer = token.isBuyer;
        (session.user as any).isSeller = token.isSeller;
        (session.user as any).isFreelancer = token.isFreelancer;
      }
      return session;
    },
  },
});
