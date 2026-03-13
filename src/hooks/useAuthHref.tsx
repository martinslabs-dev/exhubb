"use client";

import { useSession } from "next-auth/react";

export default function useAuthHref(authedHref: string, unauthHref: string) {
  const { data: session } = useSession();
  return session?.user ? authedHref : unauthHref;
}
