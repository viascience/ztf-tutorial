/**
 * JWT Authentication Middleware with Keycloak JWKS Verification
 *
 * This middleware replaces the basic token validation with proper JWT verification:
 * 1. Validates JWT signature using Keycloak's JWKS endpoint
 * 2. Verifies token claims (expiry, issuer, audience)
 * 3. Extracts user's public_key from token payload
 * 4. Stores authentication info in request context for downstream middleware
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';

// Extend Request interface to include authenticated user info
export interface AuthenticatedRequest extends express.Request {
  authToken?: string;
  userId?: string;
  userPublicKey?: string;
  jwtPayload?: any;
}

// JWT verification configuration
const KEYCLOAK_REALM_URL = process.env.KEYCLOAK_REALM_URL || 'https://auth.solvewithvia.com/auth/realms/ztf_demo';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'localhost-app';
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_AUDIENCE || 'account'; // Keycloak typically uses 'account' as audience
const JWKS_CACHE_DURATION = parseInt(process.env.JWKS_CACHE_DURATION || '600000'); // 10 minutes default

// Initialize JWKS client for fetching Keycloak's public keys
const jwksClientInstance = jwksClient({
  jwksUri: `${KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: JWKS_CACHE_DURATION,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

/**
 * Get signing key from Keycloak JWKS endpoint
 */
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    console.error('[JWT] Missing key ID (kid) in JWT header');
    return callback(new Error('Missing key ID (kid) in JWT header'));
  }

  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('[JWT] Failed to get signing key:', err);
      return callback(err);
    }

    if (!key) {
      console.error('[JWT] No signing key returned');
      return callback(new Error('No signing key returned'));
    }

    // Try different methods to get the public key from jwks-client
    let signingKey: string | undefined;

    if (typeof (key as any).getPublicKey === 'function') {
      signingKey = (key as any).getPublicKey();
    } else if ((key as any).publicKey) {
      signingKey = (key as any).publicKey;
    } else if ((key as any).rsaPublicKey) {
      signingKey = (key as any).rsaPublicKey;
    } else {
      console.error('[JWT] Unknown key format:', key);
      return callback(new Error('Unable to extract public key from signing key'));
    }

    if (!signingKey) {
      console.error('[JWT] No public key found in signing key');
      return callback(new Error('No public key found in signing key'));
    }

    callback(null, signingKey);
  });
}

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [JWT] Processing authentication for ${req.method} ${req.path}`);

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({
        success: false,
        error: 'ACCESS_TOKEN_REQUIRED',
        message: 'Bearer token required for API access'
      });
    }


    // Verify JWT token with Keycloak JWKS
    jwt.verify(token, getKey, {
      audience: KEYCLOAK_AUDIENCE, // Use 'account' as audience, not client ID
      issuer: KEYCLOAK_REALM_URL,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('[JWT] ❌ Token verification failed:', err.message);

        // Provide specific error messages for different JWT failures
        let errorType = 'JWT_VERIFICATION_FAILED';
        let message = 'Token verification failed';

        if (err.name === 'TokenExpiredError') {
          errorType = 'JWT_EXPIRED';
          message = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          errorType = 'JWT_INVALID_SIGNATURE';
          message = 'Invalid token signature';
        } else if (err.name === 'NotBeforeError') {
          errorType = 'JWT_NOT_YET_VALID';
          message = 'Token not yet valid';
        }

        return res.status(401).json({
          success: false,
          error: errorType,
          message
        });
      }

      // Cast decoded payload
      const payload = decoded as any;

      // Validate required claims
      if (!payload.sub) {
        console.error('[JWT] ❌ Missing subject claim in token');
        return res.status(401).json({
          success: false,
          error: 'JWT_INVALID_CLAIMS',
          message: 'Token missing required claims'
        });
      }

      // Validate authorized party (client ID) to ensure token is for our app
      if (payload.azp !== KEYCLOAK_CLIENT_ID) {
        console.error('[JWT] ❌ Token not authorized for this client:', payload.azp, 'expected:', KEYCLOAK_CLIENT_ID);
        return res.status(401).json({
          success: false,
          error: 'JWT_INVALID_CLIENT',
          message: 'Token not issued for this client application'
        });
      }

      // Extract user's public key from token payload
      const userPublicKey = payload.public_key;
      if (!userPublicKey) {
        console.error('[JWT] ❌ No public_key found in token payload');
        return res.status(401).json({
          success: false,
          error: 'PUBLIC_KEY_NOT_FOUND',
          message: 'Token does not contain required public_key for signature verification'
        });
      }

      // Extract user identifier (prefer email, fallback to preferred_username, then sub)
      const userId = payload.email || payload.preferred_username || payload.sub;

      // Store authentication info in request context
      req.authToken = token;
      req.userId = userId;
      req.userPublicKey = userPublicKey;
      req.jwtPayload = payload;

      console.log(`[AUTH] User authenticated: ${userId}`);

      next();
    });

  } catch (error) {
    console.error('[JWT] ❌ Unexpected error during authentication:', error);
    return res.status(500).json({
      success: false,
      error: 'JWT_PROCESSING_ERROR',
      message: 'An error occurred while processing authentication'
    });
  }
};

/**
 * Utility function to validate JWT configuration
 */
export const validateJWTConfig = (): boolean => {
  if (!KEYCLOAK_REALM_URL) {
    console.error('[JWT] Missing KEYCLOAK_REALM_URL environment variable');
    return false;
  }

  if (!KEYCLOAK_CLIENT_ID) {
    console.error('[JWT] Missing KEYCLOAK_CLIENT_ID environment variable');
    return false;
  }

  console.log(`[JWT] Configuration validated:`);
  console.log(`[JWT] - Realm URL: ${KEYCLOAK_REALM_URL}`);
  console.log(`[JWT] - Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`[JWT] - Expected Audience: ${KEYCLOAK_AUDIENCE}`);
  console.log(`[JWT] - JWKS Cache Duration: ${JWKS_CACHE_DURATION}ms`);

  return true;
};