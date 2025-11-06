import { webcrypto } from "crypto";

/**
 * Generate a cryptographically secure random string for PKCE code verifier
 * @param length Length of the string (43-128 characters per PKCE spec)
 */
export function generateCodeVerifier(length: number = 128): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  
  if (typeof window !== "undefined") {
    window.crypto.getRandomValues(randomValues);
  } else {
    webcrypto.getRandomValues(randomValues);
  }
  
  return Array.from(randomValues)
    .map((val) => charset[val % charset.length])
    .join("");
}

/**
 * Generate PKCE code challenge from code verifier
 * Uses SHA-256 hashing and base64url encoding
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  
  let hashBuffer: ArrayBuffer;
  if (typeof window !== "undefined") {
    hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  } else {
    hashBuffer = await webcrypto.subtle.digest("SHA-256", data);
  }
  
  return base64UrlEncode(hashBuffer);
}

/**
 * Base64 URL encoding without padding
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}



