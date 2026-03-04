// Extend Auth.js types so TypeScript knows about our custom fields
// on session.user (isBuyer, isSeller, isFreelancer, id)

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isBuyer: boolean;
      isSeller: boolean;
      isFreelancer: boolean;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    isBuyer?: boolean;
    isSeller?: boolean;
    isFreelancer?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified: Date | null;
    isBuyer: boolean;
    isSeller: boolean;
    isFreelancer: boolean;
  }
}
