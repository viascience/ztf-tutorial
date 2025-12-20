/**
 * Signature Validation Middleware for Sensitive Endpoints
 *
 * This middleware implements cryptographic signature verification for sensitive operations:
 * 1. Creates deterministic SHA256 hash of request body (excluding signature field)
 * 2. Verifies ECDSA signature using user's public key from JWT token
 * 3. Prevents request tampering and ensures user authorization
 * 4. Provides comprehensive audit logging for sensitive operations
 */

import express from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { AuthenticatedRequest } from './jwtAuth';
import { getEndpointByPath } from '../config/api-endpoints';

/**
 * Extended response type for signature validation errors
 */
export interface SignatureRequiredResponse {
  success: false;
  error: 'SIGNATURE_REQUIRED';
  message: string;
  requiredApproval: {
    action: string;
    riskLevel: string;
    endpoint: string;
  };
}

/**
 * Interface for signed request body with replay protection
 */
export interface SignedRequestBody {
  timestamp: number;
  nonce: string;
  signature: string;
  [key: string]: any;
}

/**
 * Replay Attack Protection - Nonce Management System
 * Simple in-memory nonce store (for demo - use Redis in production)
 */
const usedNonces = new Set<string>();
const NONCE_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_TIMESTAMP_AGE = 15 * 60 * 1000; // 15 minutes - More generous for user approval time

// Cleanup old nonces periodically
setInterval(() => {
  // Simple cleanup - in production, use timestamp-based nonce expiry
  if (usedNonces.size > 10000) {
    console.log('[SIGNATURE] Cleaning up nonce cache - size exceeded 10000 entries');
    usedNonces.clear();
  }
}, NONCE_CLEANUP_INTERVAL);

/**
 * Create deterministic JSON string for consistent hashing
 */
function createDeterministicJSON(obj: any): string {
  // Remove signature and nonce from hashing (nonce prevents replay)
  const { signature, nonce, ...objWithoutSignature } = obj;

  // Sort keys recursively to ensure consistent ordering
  function sortKeys(item: any): any {
    if (Array.isArray(item)) {
      return item.map(sortKeys);
    } else if (item !== null && typeof item === 'object') {
      return Object.keys(item)
        .sort()
        .reduce((sorted: any, key: string) => {
          sorted[key] = sortKeys(item[key]);
          return sorted;
        }, {});
    }
    return item;
  }

  const sortedObj = sortKeys(objWithoutSignature);
  return JSON.stringify(sortedObj);
}

// Note: createRequestHash function removed as we now use contextual message binding
// instead of simple hash-based verification to prevent cross-endpoint signature reuse

/**
 * Create human-readable message for wallet signature
 * Users must be able to understand exactly what they're approving
 */
function createHumanReadableMessage(method: string, endpoint: string, params: any, timestamp: number): string {
  // Remove signature-specific fields from parameters
  const { signature, nonce, timestamp: _, ...cleanParams } = params;

  const action = generateActionDescription(endpoint, cleanParams);
  const readableTimestamp = new Date(timestamp).toISOString();

  // Create clear, human-readable approval message
  return `VIA WALLET APPROVAL REQUIRED

Action: ${action}
Endpoint: ${method} ${endpoint}
Timestamp: ${readableTimestamp}

Parameters:
${JSON.stringify(cleanParams, null, 2)}

By signing this message, you approve this sensitive operation.`;
}

/**
 * Convert uncompressed public key to Ethereum address
 */
function publicKeyToAddress(publicKey: string): string {
  try {
    // Remove 0x prefix if present
    const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;

    // If it's already an address (40 chars), return as-is
    if (cleanPublicKey.length === 40) {
      return `0x${cleanPublicKey}`;
    }

    // If it's an uncompressed public key (130 chars: 04 + 64 + 64)
    if (cleanPublicKey.length === 130 && cleanPublicKey.startsWith('04')) {
      return ethers.utils.computeAddress(`0x${cleanPublicKey}`);
    }

    // If it's a compressed public key (66 chars: 02/03 + 64)
    if (cleanPublicKey.length === 66 && (cleanPublicKey.startsWith('02') || cleanPublicKey.startsWith('03'))) {
      return ethers.utils.computeAddress(`0x${cleanPublicKey}`);
    }

    // Unknown format, return as-is and let comparison fail with clear error
    console.error(`[SIGNATURE] ❌ Unknown public key format: length=${cleanPublicKey.length}, prefix=${cleanPublicKey.substring(0, 4)}`);
    return `0x${cleanPublicKey}`;

  } catch (error) {
    console.error('[SIGNATURE] ❌ Failed to convert public key to address:', error);
    return publicKey; // Return original and let comparison fail
  }
}

/**
 * Verify ECDSA signature using public key (secp256k1 curve)
 */
function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    // Use ethers.js to verify ECDSA signature against secp256k1 curve
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    // Convert the publicKey from JWT token to Ethereum address format for comparison
    const expectedAddress = publicKeyToAddress(publicKey);

    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('[SIGNATURE] ECDSA verification failed:', error);
    return false;
  }
}

/**
 * Generate human-readable action descriptions for audit logging
 */
function generateActionDescription(endpoint: string, params: any): string {
  switch (endpoint) {
    case '/api/sensitive/bulk-export':
      return `Export data: "${params.query}" to destination "${params.destination}"`;

    case '/api/sensitive/external-communication':
      return `Send external message to "${params.recipient}": "${params.subject}"`;

    case '/api/sensitive/modify-permissions':
      return `${params.action === 'grant' ? 'Grant' : 'Revoke'} permissions ${JSON.stringify(params.permissions)} for user "${params.userId}"`;

    case '/api/sensitive/financial-transaction':
      return `Process ${params.type} of $${params.amount} to "${params.recipient}"`;

    case '/api/sensitive/deploy-code':
      return `Deploy code from "${params.repository}:${params.branch}" to "${params.environment}"`;

    default:
      return `Perform sensitive action: ${endpoint}`;
  }
}

/**
 * Signature Validation Middleware
 */
export const validateSignature = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SIGNATURE] Processing signature validation for ${req.method} ${req.path}`);

  try {
    // Ensure JWT middleware has run first
    if (!req.userPublicKey) {
      console.error('[SIGNATURE] ❌ No public key found - JWT middleware must run first');
      return res.status(500).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: 'Authentication required before signature validation'
      });
    }

    // Extract timestamp, nonce, and signature for replay protection
    const { signature, timestamp, nonce, ...actionParams } = req.body;

    console.log(`[SIGNATURE] Sensitive endpoint access: ${req.originalUrl} by ${req.userId}`);

    const endpoint = getEndpointByPath(req.originalUrl);
    const riskLevel = endpoint?.riskLevel || 'HIGH';

    // Check if this is initial request without signature (should trigger wallet approval)
    if (!signature || signature.trim() === '') {
      console.log(`[SECURITY] Signature required for ${req.originalUrl} - User: ${req.userId}`);
      const response: SignatureRequiredResponse = {
        success: false,
        error: 'SIGNATURE_REQUIRED',
        message: 'This sensitive operation requires VIA wallet signature',
        requiredApproval: {
          action: generateActionDescription(req.originalUrl, actionParams),
          riskLevel: endpoint?.riskLevel || 'HIGH',
          endpoint: req.originalUrl
        }
      };
      return res.status(403).json(response);
    }

    // Only validate timestamp/nonce if signature is provided (signed request)
    const now = Date.now();
    const requestTime = parseInt(timestamp);

    if (!timestamp || isNaN(requestTime) || Math.abs(now - requestTime) > MAX_TIMESTAMP_AGE) {
      console.log(`[SECURITY] Request expired - User: ${req.userId}, Age: ${Math.abs(now - requestTime)}ms`);
      return res.status(400).json({
        success: false,
        error: 'REQUEST_EXPIRED',
        message: 'Request timestamp is too old or invalid (max 15 minutes)'
      });
    }

    // Validate nonce uniqueness
    if (!nonce || typeof nonce !== 'string' || nonce.length < 8) {
      console.log(`[SECURITY] Invalid nonce - User: ${req.userId}`);
      return res.status(400).json({
        success: false,
        error: 'INVALID_NONCE',
        message: 'Valid nonce is required (minimum 8 characters)'
      });
    }

    if (usedNonces.has(nonce)) {
      console.log(`[SECURITY] Replay attack detected - User: ${req.userId}, Nonce: ${nonce.substring(0, 8)}...`);
      return res.status(400).json({
        success: false,
        error: 'NONCE_REUSED',
        message: 'Nonce has already been used (replay attack prevention)'
      });
    }

    // Mark nonce as used
    usedNonces.add(nonce);

    // Create the human-readable message that should have been signed
    // Users must understand exactly what they approved
    let messageToVerify: string;
    try {
      messageToVerify = createHumanReadableMessage(
        req.method,
        req.originalUrl,
        req.body,
        parseInt(timestamp)
      );

      // Signature verification in progress
    } catch (error) {
      console.error('[SECURITY] Failed to create verification message:', error);
      return res.status(400).json({
        success: false,
        error: 'MALFORMED_SIGNED_MESSAGE',
        message: 'Could not create contextual message for signature verification'
      });
    }

    // Verify the signature
    const isValidSignature = verifySignature(messageToVerify, signature, req.userPublicKey);

    if (!isValidSignature) {
      console.error(`[SECURITY] Signature verification failed - User: ${req.userId}, Endpoint: ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        error: 'SIGNATURE_VERIFICATION_FAILED',
        message: 'Invalid signature'
      });
    }

    console.log(`[SECURITY] Signature verified - User: ${req.userId}, Action: ${generateActionDescription(req.originalUrl, actionParams)}`);

    // Store verified signature info for audit trail
    (req as any).verifiedSignature = {
      signature,
      messageVerified: messageToVerify,
      actionDescription: generateActionDescription(req.originalUrl, actionParams),
      endpoint: req.originalUrl,
      method: req.method,
      signedTimestamp: parseInt(timestamp),
      verificationTimestamp: Date.now(),
      riskLevel
    };

    next();

  } catch (error) {
    console.error('[SECURITY] Signature processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'SIGNATURE_PROCESSING_ERROR',
      message: 'An error occurred while processing signature validation'
    });
  }
};

/**
 * Utility function for signature validation debugging
 * Updated to match new human-readable signature format
 */
export const createSignatureDebugInfo = (
  method: string,
  endpoint: string,
  requestBody: any,
  publicKey: string
) => {
  const { timestamp } = requestBody;
  const messageToSign = createHumanReadableMessage(method, endpoint, requestBody, parseInt(timestamp));

  return {
    method,
    endpoint,
    timestamp: parseInt(timestamp),
    humanReadableMessage: messageToSign,
    messageToSign,
    publicKey: publicKey.substring(0, 20) + '...',
    signatureFormat: 'Human-readable message for clear user consent'
  };
};