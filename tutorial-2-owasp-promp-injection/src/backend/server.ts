/**
 * Express Backend Server for OWASP Prompt Injection Demo
 *
 * This server implements the two-tier security architecture:
 * - Regular endpoints: Standard bearer token authentication
 * - Sensitive endpoints: Bearer token + VIA wallet signature required
 */

import 'dotenv/config'; // Load environment variables
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { ALL_ENDPOINTS, getEndpointByPath } from './config/api-endpoints';
import { createLLMServiceFromEnv, LLMService } from './services/LLMService';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SignatureRequiredResponse extends ApiResponse {
  error: 'SIGNATURE_REQUIRED';
  requiredApproval: {
    action: string;
    riskLevel: string;
    endpoint: string;
  };
}

// Express app initialization
const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Initialize LLM Service
let llmService: LLMService | null = null;
try {
  llmService = createLLMServiceFromEnv();
  console.log('✅ LLM Service initialized successfully');
} catch (error) {
  console.warn('⚠️ LLM Service initialization failed:', error);
  console.warn('🔧 Agent functionality will be disabled. Please check your .env configuration.');
}

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Basic bearer token authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'ACCESS_TOKEN_REQUIRED',
      message: 'Bearer token required for API access'
    });
  }

  // TODO: Production implementations should validate JWT tokens properly
  // For demo purposes, we just check that a token is present
  if (token.length < 10) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token appears to be invalid'
    });
  }

  // Store token info for downstream middleware
  (req as any).authToken = token;
  (req as any).userId = 'demo-user@company.com'; // Mock user ID

  next();
};

// Demo signature validation middleware for sensitive endpoints
const validateSensitiveEndpoint = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { signature, ...actionParams } = req.body;

  console.log(`[MIDDLEWARE] Processing request: ${req.method} ${req.path}`);
  console.log(`[MIDDLEWARE] Original URL: ${req.originalUrl}`);
  console.log(`[MIDDLEWARE] Request body:`, req.body);

  // Since this middleware is only mounted on /api/sensitive routes,
  // any request hitting it is by definition a sensitive endpoint
  console.log(`[MIDDLEWARE] ⚠️ SENSITIVE ENDPOINT DETECTED: ${req.method} ${req.originalUrl}`);
  console.log(`[MIDDLEWARE] Signature provided: ${signature ? 'YES' : 'NO'}`);
  console.log(`[MIDDLEWARE] Full signature value:`, signature);

  const endpoint = getEndpointByPath(req.originalUrl);
  const riskLevel = endpoint?.riskLevel || 'HIGH';

  console.log(`[MIDDLEWARE] Endpoint found:`, endpoint ? 'YES' : 'NO');
  console.log(`[MIDDLEWARE] Risk level:`, riskLevel);

  // Check if signature is provided
  if (!signature || signature.trim() === '') {
    console.log(`[MIDDLEWARE] 🚫 NO SIGNATURE PROVIDED - BLOCKING REQUEST`);
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
    console.log(`[MIDDLEWARE] Sending 403 response:`, response);
    return res.status(403).json(response);
  }

  // TODO: Production implementations must verify the signature properly:
  // - Extract user's public key from JWT token
  // - Generate expected message for this specific action
  // - Cryptographically verify signature matches expected message and user
  // - Check for replay attacks using signature/timestamp tracking
  // - Validate signature format and encoding

  // Demo validation: Just check signature exists and looks reasonable
  if (signature.length < 10) {
    console.log(`[MIDDLEWARE] 🚫 INVALID SIGNATURE FORMAT - BLOCKING REQUEST`);
    console.log(`[MIDDLEWARE] Signature length: ${signature.length}`);
    return res.status(403).json({
      success: false,
      error: 'INVALID_SIGNATURE_FORMAT',
      message: 'Signature appears to be invalid or corrupted'
    });
  }

  console.log(`[MIDDLEWARE] ✅ SIGNATURE VALIDATED - ALLOWING REQUEST`);
  console.log(`[MIDDLEWARE] Signature length: ${signature.length}`);

  // Log sensitive action for demo analytics
  console.log(`[SENSITIVE ACTION] ${req.originalUrl} - User: ${(req as any).userId} - Action: ${generateActionDescription(req.originalUrl, actionParams)}`);

  // Store verified action info
  (req as any).verifiedAction = {
    signature,
    actionDescription: generateActionDescription(req.originalUrl, actionParams),
    timestamp: Date.now(),
    demoMode: true
  };

  console.log(`[MIDDLEWARE] Proceeding to endpoint handler...`);
  next();
};

// Utility function to generate human-readable action descriptions
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

// Apply authentication to all API routes
app.use('/api', authenticateToken);

// Apply sensitive endpoint validation
app.use('/api/sensitive', validateSensitiveEndpoint);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }
  });
});

// ===== AGENT ENDPOINT =====
// Main agent endpoint that processes user requests through LLM
app.post('/api/agent/process-request', async (req, res) => {
  if (!llmService) {
    return res.status(503).json({
      success: false,
      error: 'LLM_SERVICE_UNAVAILABLE',
      message: 'LLM service is not available. Please check server configuration.'
    });
  }

  try {
    const { userInput, injectionScenario } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'userInput is required and must be a string'
      });
    }

    console.log(`[AGENT] Processing request from user: ${(req as any).userId}`);
    console.log(`[AGENT] User input: ${userInput.substring(0, 100)}...`);

    if (injectionScenario) {
      console.log(`[AGENT] 🚨 Injection scenario detected: ${injectionScenario.substring(0, 50)}...`);
    }

    // Process through LLM
    const result = await llmService.processUserRequest(userInput, injectionScenario);

    // Log the results for demo analytics
    console.log(`[AGENT] Processing complete - Success: ${result.success}`);
    console.log(`[AGENT] Generated ${result.apiCalls.length} API calls`);

    if (result.injectionAnalysis?.likelyInjected) {
      console.log(`[AGENT] 🚨 INJECTION DETECTED - Confidence: ${result.injectionAnalysis.confidence}%`);
      console.log(`[AGENT] Suspicious patterns: ${result.injectionAnalysis.suspiciousPatterns.join(', ')}`);
    }

    return res.json({
      success: result.success,
      data: {
        apiCalls: result.apiCalls,
        injectionAnalysis: result.injectionAnalysis,
        processingTimestamp: new Date().toISOString()
      },
      error: result.error
    });

  } catch (error) {
    console.error('[AGENT] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'AGENT_PROCESSING_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
});

// ===== DEBUG ENDPOINTS (Demo only) =====
app.get('/api/debug/system-prompt', (req, res) => {
  if (!llmService) {
    return res.status(503).json({ error: 'LLM service unavailable' });
  }

  res.json({
    success: true,
    data: {
      systemPrompt: llmService.getSystemPrompt(),
      endpoints: ALL_ENDPOINTS.length,
      provider: process.env.LLM_PROVIDER || 'openai'
    }
  });
});

// ===== REGULAR API ENDPOINTS =====
// These endpoints require only bearer token authentication

// GET /api/regular/system-status
app.get('/api/regular/system-status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: Math.floor(process.uptime()) + ' seconds',
      version: '2.1.0',
      services: {
        database: 'online',
        authentication: 'online',
        external_apis: 'online'
      },
      timestamp: new Date().toISOString()
    }
  });
});

// POST /api/regular/user-lookup
app.post('/api/regular/user-lookup', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_USER_ID',
      message: 'userId parameter is required'
    });
  }

  // Mock user data
  const mockUser = {
    userId,
    name: userId.includes('john') ? 'John Smith' : 'Jane Doe',
    department: 'Engineering',
    lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };

  res.json({
    success: true,
    data: mockUser
  });
});

// POST /api/regular/single-record
app.post('/api/regular/single-record', (req, res) => {
  const { table, id } = req.body;

  if (!table || !id) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_PARAMETERS',
      message: 'table and id parameters are required'
    });
  }

  // Mock record data based on table
  let mockRecord;
  switch (table) {
    case 'tickets':
      mockRecord = {
        id,
        title: 'Login Issues',
        status: 'open',
        priority: 'medium',
        assignee: 'support@company.com',
        createdAt: new Date().toISOString()
      };
      break;
    case 'users':
      mockRecord = {
        id,
        name: 'User ' + id,
        email: `${id}@company.com`,
        status: 'active'
      };
      break;
    default:
      mockRecord = {
        id,
        table,
        data: 'Mock data for ' + table
      };
  }

  res.json({
    success: true,
    data: mockRecord
  });
});

// POST /api/regular/search-tickets
app.post('/api/regular/search-tickets', (req, res) => {
  const { query, limit = 10 } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_QUERY',
      message: 'query parameter is required'
    });
  }

  // Mock ticket search results
  const mockTickets = [
    { id: 'TICKET-123', title: `${query} - User cannot access dashboard`, status: 'open' },
    { id: 'TICKET-456', title: `${query} - Password reset not working`, status: 'in-progress' },
    { id: 'TICKET-789', title: `Related to ${query}`, status: 'resolved' }
  ].slice(0, Math.min(limit, 10));

  res.json({
    success: true,
    data: {
      results: mockTickets,
      total: mockTickets.length,
      query
    }
  });
});

// ===== SENSITIVE API ENDPOINTS =====
// These endpoints require bearer token + VIA wallet signature

// POST /api/sensitive/bulk-export
app.post('/api/sensitive/bulk-export', (req, res) => {
  const { query, destination, format = 'CSV' } = req.body;

  // Mock bulk export operation
  const mockExportResult = {
    exportId: 'EXP-' + Date.now(),
    status: 'completed',
    recordCount: Math.floor(Math.random() * 50000) + 1000,
    destination,
    format,
    query: query || 'SELECT * FROM customers',
    executedAt: new Date().toISOString(),
    estimatedValue: '$2.4M+ customer data'
  };

  console.log(`[SENSITIVE] Bulk export executed - ${mockExportResult.recordCount} records to ${destination}`);

  res.json({
    success: true,
    data: mockExportResult,
    message: `Export of ${mockExportResult.recordCount} records completed`
  });
});

// POST /api/sensitive/external-communication
app.post('/api/sensitive/external-communication', (req, res) => {
  const { recipient, subject, message, attachments = [] } = req.body;

  const mockMessageResult = {
    messageId: 'MSG-' + Date.now(),
    status: 'sent',
    recipient,
    subject,
    sentAt: new Date().toISOString(),
    attachmentCount: attachments.length,
    estimatedDataSize: '15.2 MB'
  };

  console.log(`[SENSITIVE] External email sent to ${recipient} with ${attachments.length} attachments`);

  res.json({
    success: true,
    data: mockMessageResult,
    message: `Message sent to external recipient: ${recipient}`
  });
});

// POST /api/sensitive/modify-permissions
app.post('/api/sensitive/modify-permissions', (req, res) => {
  const { userId, permissions, action } = req.body;

  const mockPermissionResult = {
    operationId: 'PERM-' + Date.now(),
    status: 'completed',
    userId,
    action,
    modifiedPermissions: permissions,
    previousPermissions: ['read', 'write'],
    newPermissions: action === 'grant'
      ? ['read', 'write', ...permissions]
      : ['read', 'write'],
    executedAt: new Date().toISOString()
  };

  console.log(`[SENSITIVE] ${action} permissions ${permissions.join(', ')} for user ${userId}`);

  res.json({
    success: true,
    data: mockPermissionResult,
    message: `Permissions ${action}ed for user ${userId}`
  });
});

// POST /api/sensitive/financial-transaction
app.post('/api/sensitive/financial-transaction', (req, res) => {
  const { amount, recipient, type, reference } = req.body;

  const mockTransactionResult = {
    transactionId: 'TXN-' + Date.now(),
    status: 'processing',
    amount,
    recipient,
    type,
    reference,
    estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    authorizationCode: 'AUTH-' + Math.random().toString(36).substr(2, 9)
  };

  console.log(`[SENSITIVE] Financial transaction: $${amount} ${type} to ${recipient}`);

  res.json({
    success: true,
    data: mockTransactionResult,
    message: `${type} of $${amount} initiated to ${recipient}`
  });
});

// POST /api/sensitive/deploy-code
app.post('/api/sensitive/deploy-code', (req, res) => {
  const { environment, repository, branch } = req.body;

  const mockDeployResult = {
    deploymentId: 'DEP-' + Date.now(),
    status: 'initiated',
    environment,
    repository,
    branch,
    estimatedDuration: '15 minutes',
    buildNumber: Math.floor(Math.random() * 1000) + 1000,
    startedAt: new Date().toISOString()
  };

  console.log(`[SENSITIVE] Code deployment: ${repository}:${branch} to ${environment}`);

  res.json({
    success: true,
    data: mockDeployResult,
    message: `Deployment to ${environment} initiated`
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: ALL_ENDPOINTS.map(e => `${e.method} ${e.path}`)
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OWASP Prompt Injection Demo Backend`);
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`📊 API Endpoints loaded: ${ALL_ENDPOINTS.length} total`);
    console.log(`   - Regular endpoints: ${ALL_ENDPOINTS.filter(e => e.category === 'regular').length}`);
    console.log(`   - Sensitive endpoints: ${ALL_ENDPOINTS.filter(e => e.category === 'sensitive').length}`);
    console.log(`🔒 Demo signature validation enabled (Production TODOs in place)`);
  });
}

export default app;