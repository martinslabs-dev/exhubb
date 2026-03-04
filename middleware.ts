import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Auth.js v5 middleware — runs at the Edge before any route renders.
// No DB query here — just reads the signed JWT cookie (~0ms).

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Routes that require authentication
  const protectedPrefixes = [
    "/dashboard",
    "/sell",
    "/post-job",
    "/settings",
    "/orders",
    "/messages",
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  // Redirect unauthenticated users to login, preserving the intended URL
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users with unverified email to /verify-email
  if (isProtected && isLoggedIn && !req.auth?.user?.emailVerified) {
    const verifyUrl = new URL("/verify-email", nextUrl.origin);
    if (req.auth?.user?.email) {
      verifyUrl.searchParams.set("email", req.auth.user.email);
    }
    return NextResponse.redirect(verifyUrl);
  }

  // Redirect already-logged-in users away from auth pages
  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static assets and API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
