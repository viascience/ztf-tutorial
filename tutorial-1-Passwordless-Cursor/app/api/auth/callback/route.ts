import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, decodeIdToken } from "@/lib/auth/keycloak";
import { getSession } from "@/lib/auth/session";
import {
  getUserByKeycloakSub,
  createUser,
  updateUserLastLogin,
} from "@/lib/db/queries";
import { TokenResponse, KeycloakTokenPayload, User } from "@/types/auth";

// Constants
const ALLOWED_ORIGIN =
  process.env.KEYCLOAK_URL || "https://auth.solvewithvia.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const CODE_PREVIEW_LENGTH = 10;

// Helper function to create CORS headers
function createCorsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Helper function to create error redirect response
function createErrorRedirect(error: string, detail?: string): NextResponse {
  const url = detail
    ? `${APP_URL}/?error=${error}&detail=${detail}`
    : `${APP_URL}/?error=${error}`;

  const response = NextResponse.redirect(url);
  Object.entries(createCorsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Handle CORS preflight requests for Keycloak authentication
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(),
  });
}

// Helper function to extract code verifier from state or session
async function getCodeVerifier(state: string | null): Promise<string | null> {
  // Primary method: retrieve from state parameter
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      if (stateData.verifier) {
        console.log("Code verifier retrieved from state parameter");
        return stateData.verifier;
      }
    } catch (err) {
      console.error("Failed to decode state parameter:", err);
    }
  }

  // Fallback: retrieve from session
  const session = await getSession();
  if (session.codeVerifier) {
    console.log("Code verifier retrieved from session (fallback)");
    return session.codeVerifier;
  }

  return null;
}

// Helper function to handle user creation/update
async function handleUserAuth(userInfo: KeycloakTokenPayload): Promise<User> {
  let user = await getUserByKeycloakSub(userInfo.sub);

  if (!user) {
    console.log("Creating new user in database");
    user = await createUser(
      userInfo.sub,
      userInfo.email,
      userInfo.name || userInfo.preferred_username || userInfo.email
    );
  } else {
    console.log("User exists, updating last login");
    await updateUserLastLogin(user.id);
  }

  return user;
}

// Helper function to create and save session
async function createUserSession(
  user: User,
  tokens: TokenResponse
): Promise<void> {
  const session = await getSession();

  // Store minimal data to avoid cookie size limit
  // Note: JWT tokens are ~2000+ bytes each, cookies limited to 4096 bytes
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name || undefined;
  session.accessToken = tokens.access_token;
  session.idToken = tokens.id_token;
  session.expiresAt = Date.now() + tokens.expires_in * 1000;
  session.sessionId = crypto.randomUUID();

  // Clear code verifier
  delete session.codeVerifier;

  await session.save();
}

/**
 * Handles OAuth callback from Keycloak authentication.
 *
 * Flow:
 * 1. Validates OAuth parameters (code, error handling)
 * 2. Retrieves PKCE code verifier from state or session
 * 3. Exchanges authorization code for tokens
 * 4. Decodes user info from ID token
 * 5. Creates or updates user in database
 * 6. Creates user session with tokens
 * 7. Redirects to dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return createErrorRedirect("auth_failed", error);
    }

    // Validate authorization code
    if (!code) {
      console.error("No authorization code received");
      return createErrorRedirect("no_code");
    }

    console.log(
      "Callback received with code:",
      code.substring(0, CODE_PREVIEW_LENGTH) + "..."
    );

    // Get code verifier
    const state = searchParams.get("state");
    const codeVerifier = await getCodeVerifier(state);

    if (!codeVerifier) {
      console.error("No code verifier found in state or session");
      console.error("This indicates an issue with OAuth state management");
      return createErrorRedirect("no_verifier");
    }

    console.log("Code verifier found, proceeding with token exchange");

    // Exchange authorization code for tokens
    const redirectUri = `${APP_URL}/api/auth/callback`;
    console.log("Exchanging code for tokens with redirect_uri:", redirectUri);
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);
    console.log("Token exchange successful");

    // Decode ID token to get user info
    const userInfo = await decodeIdToken(tokens.id_token);
    console.log("User info from ID token:", {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
    });

    // Handle user authentication (create or update)
    const user = await handleUserAuth(userInfo);

    // Create user session
    await createUserSession(user, tokens);

    // Redirect to dashboard
    console.log("Session created successfully, redirecting to dashboard");
    const successResponse = NextResponse.redirect(`${APP_URL}/dashboard`);
    Object.entries(createCorsHeaders()).forEach(([key, value]) => {
      successResponse.headers.set(key, value);
    });

    return successResponse;
  } catch (error) {
    console.error("Callback error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorResponse = NextResponse.redirect(
      `${APP_URL}/?error=callback_failed&message=${encodeURIComponent(
        errorMessage
      )}`
    );

    Object.entries(createCorsHeaders()).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}
