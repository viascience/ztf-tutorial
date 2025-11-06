import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle OPTIONS requests for CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://auth.solvewithvia.com",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      },
    });
  }

  // Protected routes - let the route handler validate the session
  // Middleware in Next.js 15 with iron-session works better at the route level
  if (pathname.startsWith("/dashboard")) {
    // Check if session cookie exists
    const sessionCookie = request.cookies.get("via_ztf_session");

    if (!sessionCookie) {
      const url = new URL("/", request.url);
      url.searchParams.set("reason", "session_required");
      return NextResponse.redirect(url);
    }
  }

  // Don't redirect from home page based on cookie alone
  // Let the server components check if there's a valid userId in the session
  // The cookie might exist with just codeVerifier during OAuth flow

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

