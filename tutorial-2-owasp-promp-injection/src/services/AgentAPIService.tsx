/**
 * Agent API Service
 *
 * This service handles communication with the backend agent API
 * and provides the interface for live agent processing
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

// Add authorization header to all requests
apiClient.interceptors.request.use((config) => {
  // Use demo token for now - in production this would be the real JWT
  config.headers.Authorization = 'Bearer demo-token-12345';
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

export class AgentAPIService {

  /**
   * Process user input through the LLM agent
   */
  async processUserRequest(
    userInput: string,
    injectionScenario?: string
  ): Promise<AgentProcessingResult> {
    try {
      console.log('[AgentAPI] Processing user request through LLM agent');

      const response = await apiClient.post('/api/agent/process-request', {
        userInput,
        injectionScenario
      });

      return response.data;

    } catch (error) {
      console.error('[AgentAPI] Error processing request:', error);

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
      console.log(`[AgentAPI] Executing ${apiCall.method} ${apiCall.endpoint}`);

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
      console.error(`[AgentAPI] Error executing ${apiCall.endpoint}:`, error);

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
   */
  async executeAPICallWithSignature(
    apiCall: GeneratedAPICall,
    signature: string
  ): Promise<APIExecutionResult> {
    try {
      console.log(`[AgentAPI] Executing ${apiCall.endpoint} with signature`);

      const response = await apiClient.request({
        method: apiCall.method,
        url: apiCall.endpoint,
        data: {
          ...apiCall.params,
          signature
        }
      });

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'success',
        response: response.data,
        userDecision: 'approved'
      };

    } catch (error) {
      console.error(`[AgentAPI] Error executing ${apiCall.endpoint} with signature:`, error);

      return {
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        params: apiCall.params,
        status: 'error',
        error: 'Failed to execute signed request',
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