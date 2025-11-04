import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getLogoutUrl } from "@/lib/auth/keycloak";

export async function POST() {
  try {
    // Get session
    const session = await getSession();
    const idToken = session.idToken;

    // Destroy session cookie (this is the critical part)
    session.destroy();

    const postLogoutRedirectUri = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Build Keycloak logout URL with id_token_hint for proper SSO logout
    // This clears the Keycloak SSO session so users see the email screen on next login
    let logoutUrl = postLogoutRedirectUri;
    
    if (idToken) {
      logoutUrl = getLogoutUrl(idToken, postLogoutRedirectUri);
      console.log("Session destroyed, logging out from Keycloak SSO");
    } else {
      console.log("No idToken found, local session destroyed only");
    }
    
    return NextResponse.json({ 
      logoutUrl,
      success: true 
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, try to return a valid redirect
    return NextResponse.json(
      { logoutUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
      { status: 200 } // Return 200 to allow client-side redirect
    );
  }
}

