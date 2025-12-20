/**
 * Agent API Service
 *
 * This service handles communication with the backend agent API
 * and provides the interface for live agent processing
 *
 * Updated to support:
 * - Real JWT token authentication with Keycloak
 * - Request body signing for sensitive endpoints
 * - Enhanced error handling for signature validation
 */

import axios from 'axios';

// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // 30 second timeout for LLM processing
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add authorization header to all requests using current Keycloak token
apiClient.interceptors.request.use((config) => {
  // Get current Keycloak token from window (set by App.tsx)
  const keycloak = (window as any).keycloak;

  if (keycloak?.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  } else {
    console.warn('[API] No authentication token available - requests will likely fail');
    // Note: In production, requests without valid tokens will be rejected by the backend
  }

  return config;
});

// Types matching backend interfaces
export interface GeneratedAPICall {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params: Record<string, any>;
  reasoning: string;
}

export interface InjectionAnalysis {
  suspiciousPatterns: string[];
  likelyInjected: boolean;
  confidence: number;
}

export interface AgentProcessingResult {
  success: boolean;
  data?: {
    apiCalls: GeneratedAPICall[];
    injectionAnalysis: InjectionAnalysis;
    processingTimestamp: string;
  };
  error?: string;
}

export interface APIExecutionResult {
  endpoint: string;
  method: string;
  params: any;
  status: 'success' | 'blocked' | 'requires_signature' | 'error';
  response?: any;
  userDecision?: 'approved' | 'rejected';
  error?: string;
}

// Extended error types for JWT and signature validation
export type BackendErrorType =
  | 'ACCESS_TOKEN_REQUIRED'
  | 'JWT_EXPIRED'
  | 'JWT_INVALID_SIGNATURE'
  | 'PUBLIC_KEY_NOT_FOUND'
  | 'SIGNATURE_REQUIRED'
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'MALFORMED_REQUEST_HASH'
  | 'AUTHENTICATION_ERROR'
  | string;

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
 * Create human-readable message for wallet signature
 * Users must be able to understand exactly what they're approving
 */
function createHumanReadableMessage(method: string, endpoint: string, params: any): string {
  // Remove signature-specific fields from parameters
  const { signature, nonce, timestamp: _, ...cleanParams } = params;

  const action = generateActionDescription(endpoint, cleanParams);
  const readableTimestamp = new Date(params.timestamp).toISOString();

  // Create clear, human-readable approval message
  return `VIA WALLET APPROVAL REQUIRED

Action: ${action}
Endpoint: ${method} ${endpoint}
Timestamp: ${readableTimestamp}

Parameters:
${JSON.stringify(cleanParams, null, 2)}

By signing this message, you approve this sensitive operation.`;
}

// Note: signMessage function will be passed from the component that uses useTransaction hook

export class AgentAPIService {

  /**
   * Process user input through the LLM agent
   */
  async processUserRequest(
    userInput: string,
    injectionScenario?: string
  ): Promise<AgentProcessingResult> {
    try {
      const response = await apiClient.post('/api/agent/process-request', {
        userInput,
        injectionScenario
      });

      return response.data;

    } catch (error) {
      console.error('[AgentAPI] Request processing failed:', error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to communicate with backend agent'
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred while processing request'
      };
    }
  }

  /**
   * Execute generated API calls against backend endpoints
   */
  async executeAPICall(apiCall: GeneratedAPICall): Promise<APIExecutionResult> {
    try {
      const response = await apiClient.request({
        method: apiCall.method,
        url: apiCall.endpoint,
        data: apiCall.params
      });

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'success',
        response: response.data
      };

    } catch (error) {
      console.error(`[AgentAPI] API call failed: ${apiCall.method} ${apiCall.endpoint}`, error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;

        // Check if this is a signature required error
        if (statusCode === 403 && errorData?.error === 'SIGNATURE_REQUIRED') {
          return {
            endpoint: apiCall.endpoint,
            method: apiCall.method,
            params: apiCall.params,
            status: 'requires_signature',
            response: errorData
          };
        }

        return {
          endpoint: apiCall.endpoint,
          method: apiCall.method,
          params: apiCall.params,
          status: 'error',
          error: errorData?.message || 'API call failed'
        };
      }

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'error',
        error: 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute API call with signature (for sensitive endpoints)
   * Now uses human-readable message signing for clear user consent
   */
  async executeAPICallWithSignature(
    apiCall: GeneratedAPICall,
    signMessage: (message: string) => Promise<string | null>
  ): Promise<APIExecutionResult> {
    try {
      // Add timestamp and nonce for replay protection
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create the complete request body with security fields
      const requestBody = {
        ...apiCall.params,
        timestamp,
        nonce
      };

      // Create human-readable message that matches backend expectation
      const humanReadableMessage = createHumanReadableMessage(
        apiCall.method,
        apiCall.endpoint,
        requestBody
      );

      // Sign the human-readable message directly
      const signature = await signMessage(humanReadableMessage);

      if (!signature) {
        console.error(`[AgentAPI] User rejected signature for ${apiCall.endpoint}`);
        return {
          endpoint: apiCall.endpoint,
          method: apiCall.method,
          params: apiCall.params,
          status: 'error',
          error: 'Failed to obtain signature for request',
          userDecision: 'rejected'
        };
      }

      // Add signature to request body
      const signedRequestBody = {
        ...requestBody,
        signature
      };

      const response = await apiClient.request({
        method: apiCall.method,
        url: apiCall.endpoint,
        data: signedRequestBody
      });

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'success',
        response: response.data,
        userDecision: 'approved'
      };

    } catch (error: any) {
      console.error(`[AgentAPI] Signed request failed: ${apiCall.endpoint}`, error);

      // Enhanced error handling for JWT and signature validation
      let errorMessage = 'Failed to execute signed request';

      if (error.response?.data?.error) {
        const errorType: BackendErrorType = error.response.data.error;
        errorMessage = error.response.data.message || errorMessage;

        // Handle specific error types
        switch (errorType) {
          case 'JWT_EXPIRED':
            errorMessage = 'Session expired. Please refresh the page and login again.';
            break;
          case 'JWT_INVALID_SIGNATURE':
            errorMessage = 'Invalid authentication token. Please refresh the page and login again.';
            break;
          case 'PUBLIC_KEY_NOT_FOUND':
            errorMessage = 'Authentication token missing required public key. Please contact support.';
            break;
          case 'SIGNATURE_VERIFICATION_FAILED':
            errorMessage = 'Signature verification failed. The request may have been tampered with.';
            break;
          case 'MALFORMED_REQUEST_HASH':
            errorMessage = 'Request validation failed. Please try again.';
            break;
        }
      }

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'error',
        error: errorMessage,
        userDecision: 'approved'
      };
    }
  }

  /**
   * Get backend health status
   */
  async getBackendHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await apiClient.get('/health');
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: 'Backend not available'
      };
    }
  }

  /**
   * Get system prompt for debugging (demo only)
   */
  async getSystemPrompt(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get('/api/debug/system-prompt');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get system prompt'
      };
    }
  }
}

// Default export
export const agentAPIService = new AgentAPIService();
export default agentAPIService;