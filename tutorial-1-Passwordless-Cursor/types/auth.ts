export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  sessionId?: string;
  codeVerifier?: string;
}

export interface User {
  id: string;
  keycloak_sub: string;
  email: string;
  name: string;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export interface KeycloakTokenPayload {
  sub: string;
  email: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  exp: number;
  iat: number;
}

export interface SessionValidationResponse {
  valid: boolean;
  expiresAt?: number;
  reason?: string;
}
