import { SessionData } from "@/types/auth";
import { introspectToken } from "./keycloak";

export async function validateSession(session: SessionData): Promise<boolean> {
  if (!session || !session.userId || !session.accessToken) {
    return false;
  }

  // Check if token is expired
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    return false;
  }

  // Optionally introspect token with Keycloak for additional validation
  // This can be expensive, so use sparingly or only in critical paths
  try {
    const isActive = await introspectToken(session.accessToken);
    return isActive;
  } catch {
    return false;
  }
}

export function isTokenExpiring(session: SessionData, bufferMinutes: number = 5): boolean {
  if (!session.expiresAt) {
    return false;
  }
  
  const bufferMs = bufferMinutes * 60 * 1000;
  return session.expiresAt - Date.now() < bufferMs;
}

