import { TokenResponse, KeycloakTokenPayload } from "@/types/auth";
import * as jose from "jose";

export const KEYCLOAK_CONFIG = {
  url: process.env.KEYCLOAK_URL || "https://auth.solvewithvia.com/auth",
  realm: process.env.KEYCLOAK_REALM || "ztf_demo",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "localhost-app",
};

export function getAuthorizationUrl(
  codeChallenge: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // Force re-authentication even if SSO session exists
    // prompt=login ensures fresh authentication is required
    prompt: "login",
    // max_age=0 forces Keycloak to ignore any existing authentication
    // This ensures users see the email input screen every time
    max_age: "0",
  });

  if (state) {
    params.append("state", state);
  }

  return `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const tokenEndpoint = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: KEYCLOAK_CONFIG.clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", response.status, error);
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }

  const tokens = await response.json();
  console.log("Received tokens:", { 
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    hasIdToken: !!tokens.id_token,
    expiresIn: tokens.expires_in 
  });
  return tokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokenEndpoint = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: KEYCLOAK_CONFIG.clientId,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}

export async function introspectToken(token: string): Promise<boolean> {
  const introspectEndpoint = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token/introspect`;

  const params = new URLSearchParams({
    token,
    client_id: KEYCLOAK_CONFIG.clientId,
  });

  try {
    const response = await fetch(introspectEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.active === true;
  } catch {
    return false;
  }
}

export async function decodeIdToken(idToken: string): Promise<KeycloakTokenPayload> {
  try {
    const decoded = jose.decodeJwt(idToken) as unknown as KeycloakTokenPayload;
    return decoded;
  } catch {
    throw new Error("Failed to decode ID token");
  }
}

export function getLogoutUrl(idToken: string, postLogoutRedirectUri: string): string {
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: postLogoutRedirectUri,
  });

  return `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout?${params.toString()}`;
}

