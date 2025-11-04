import { NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/auth/pkce";
import { getAuthorizationUrl } from "@/lib/auth/keycloak";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier in session AND in state parameter as backup
    // Session cookies may not be sent cross-site, so we use OAuth state parameter
    const session = await getSession();
    session.codeVerifier = codeVerifier;
    await session.save();
    
    // Encode code verifier in state parameter (base64url encoded)
    // State parameter is echoed back by Keycloak, solving cross-site cookie issues
    const state = Buffer.from(JSON.stringify({ 
      verifier: codeVerifier,
      timestamp: Date.now()
    })).toString('base64url');
    
    console.log("Code verifier stored in session and state parameter");
    console.log("Code verifier length:", codeVerifier.length);
    console.log("Redirecting to Keycloak with code_challenge");
    
    // Build authorization URL with state parameter
    const authUrl = getAuthorizationUrl(codeChallenge, redirectUri, state);
    
    // Redirect to Keycloak
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate login" },
      { status: 500 }
    );
  }
}

