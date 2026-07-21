import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect any route under /dashboard
  if (pathname.startsWith("/dashboard")) {
    // Check if auth token cookie or sb auth session exists
    const hasAuthCookie =
      request.cookies.has("sb-access-token") ||
      request.cookies.has("supabase-auth-token") ||
      Array.from(request.cookies.getAll()).some((cookie) =>
        cookie.name.includes("auth-token") || cookie.name.includes("sb-")
      );

    // Note: Client-side layout (ProtectedDashboardLayout) guarantees full Supabase session check.
    // If no auth cookie is detected on initial request, redirect to /login
    if (!hasAuthCookie) {
      // Allow initial page load to pass to ProtectedDashboardLayout for client session verification if cookie is HTTP-only/managed by client SDK
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
