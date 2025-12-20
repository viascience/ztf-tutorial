/**
 * API Endpoints Configuration for OWASP Prompt Injection Demo
 *
 * This file defines the complete API catalog that will be provided to the LLM agent.
 * The agent will use this information to generate appropriate API calls based on user requests.
 *
 * Security Architecture:
 * - Regular endpoints: Standard bearer token authentication only
 * - Sensitive endpoints: Require additional VIA wallet signature
 */

// Type definitions for endpoint configurations
export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
  validation?: {
    maxLength?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  category: 'regular' | 'sensitive';
  description: string;
  parameters: EndpointParameter[];
  maxRecords?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  securityRequirements: string[];
  examples: {
    description: string;
    request: any;
    expectedResponse: any;
  }[];
}

/**
 * Regular API Endpoints
 * These endpoints require only standard bearer token authentication
 */
export const REGULAR_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/api/regular/user-lookup',
    method: 'POST',
    category: 'regular',
    description: 'Look up individual user information by user ID or email',
    maxRecords: 1,
    riskLevel: 'LOW',
    securityRequirements: ['bearer_token'],
    parameters: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'User identifier (email or user ID)',
        example: 'john@example.com'
      }
    ],
    examples: [
      {
        description: 'Look up user by email',
        request: { userId: 'john@example.com' },
        expectedResponse: {
          userId: 'john@example.com',
          name: 'John Smith',
          department: 'Engineering',
          lastLogin: '2024-01-15T10:30:00Z'
        }
      }
    ]
  },

  {
    path: '/api/regular/system-status',
    method: 'GET',
    category: 'regular',
    description: 'Retrieve current system health and status information',
    maxRecords: 1,
    riskLevel: 'LOW',
    securityRequirements: ['bearer_token'],
    parameters: [],
    examples: [
      {
        description: 'Get system status',
        request: {},
        expectedResponse: {
          status: 'healthy',
          uptime: '15d 4h 23m',
          version: '2.1.3',
          services: {
            database: 'online',
            authentication: 'online',
            external_apis: 'degraded'
          }
        }
      }
    ]
  },

  {
    path: '/api/regular/single-record',
    method: 'POST',
    category: 'regular',
    description: 'Retrieve a single record by ID from specified table',
    maxRecords: 1,
    riskLevel: 'LOW',
    securityRequirements: ['bearer_token'],
    parameters: [
      {
        name: 'table',
        type: 'string',
        required: true,
        description: 'Table name to query',
        example: 'tickets',
        validation: {
          enum: ['tickets', 'users', 'products', 'orders']
        }
      },
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Record identifier',
        example: 'TICKET-123'
      }
    ],
    examples: [
      {
        description: 'Get support ticket details',
        request: { table: 'tickets', id: 'TICKET-123' },
        expectedResponse: {
          id: 'TICKET-123',
          title: 'Login Issues',
          status: 'open',
          priority: 'medium',
          assignee: 'support@company.com'
        }
      }
    ]
  },

  {
    path: '/api/regular/search-tickets',
    method: 'POST',
    category: 'regular',
    description: 'Search support tickets with limited results',
    maxRecords: 10,
    riskLevel: 'LOW',
    securityRequirements: ['bearer_token'],
    parameters: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'Search query string',
        example: 'login issues'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of results (max 10)',
        example: 5,
        validation: { maxLength: 10 }
      }
    ],
    examples: [
      {
        description: 'Search for login-related tickets',
        request: { query: 'login issues', limit: 5 },
        expectedResponse: {
          results: [
            { id: 'TICKET-123', title: 'Cannot login to dashboard' },
            { id: 'TICKET-456', title: 'Password reset not working' }
          ],
          total: 2,
          query: 'login issues'
        }
      }
    ]
  }
];

/**
 * Sensitive API Endpoints
 * These endpoints require bearer token + VIA wallet signature
 */
export const SENSITIVE_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/api/sensitive/bulk-export',
    method: 'POST',
    category: 'sensitive',
    description: 'Export large datasets with unlimited record limits',
    riskLevel: 'HIGH',
    securityRequirements: ['bearer_token', 'via_wallet_signature'],
    parameters: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'SQL query or data filter to export',
        example: 'SELECT * FROM customers WHERE status = \'active\''
      },
      {
        name: 'destination',
        type: 'string',
        required: true,
        description: 'Email or file destination for export',
        example: 'admin@company.com'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Export format',
        example: 'CSV',
        validation: { enum: ['CSV', 'JSON', 'XLSX'] }
      },
      {
        name: 'signature',
        type: 'string',
        required: true,
        description: 'VIA wallet signature approving this action'
      }
    ],
    examples: [
      {
        description: 'Export customer data for compliance',
        request: {
          query: 'SELECT * FROM customers WHERE created_date > \'2024-01-01\'',
          destination: 'compliance@company.com',
          format: 'CSV',
          signature: '0x1234567890abcdef...'
        },
        expectedResponse: {
          exportId: 'EXP-2024-001',
          status: 'processing',
          recordCount: 1542,
          destination: 'compliance@company.com'
        }
      }
    ]
  },

  {
    path: '/api/sensitive/external-communication',
    method: 'POST',
    category: 'sensitive',
    description: 'Send messages or data to external recipients',
    riskLevel: 'HIGH',
    securityRequirements: ['bearer_token', 'via_wallet_signature'],
    parameters: [
      {
        name: 'recipient',
        type: 'string',
        required: true,
        description: 'External email recipient',
        example: 'partner@external-company.com'
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Message subject',
        example: 'Quarterly Report Data'
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Message body',
        example: 'Please find the quarterly report attached.'
      },
      {
        name: 'attachments',
        type: 'string[]',
        required: false,
        description: 'File attachments to include'
      },
      {
        name: 'signature',
        type: 'string',
        required: true,
        description: 'VIA wallet signature approving this action'
      }
    ],
    examples: [
      {
        description: 'Send data to external partner',
        request: {
          recipient: 'partner@external-corp.com',
          subject: 'Monthly Data Export',
          message: 'Please find attached the monthly customer data export.',
          attachments: ['customer_data.csv'],
          signature: '0xabcdef1234567890...'
        },
        expectedResponse: {
          messageId: 'MSG-2024-456',
          status: 'sent',
          recipient: 'partner@external-corp.com',
          sentAt: '2024-01-15T14:30:00Z'
        }
      }
    ]
  },

  {
    path: '/api/sensitive/modify-permissions',
    method: 'POST',
    category: 'sensitive',
    description: 'Grant or revoke user permissions and access levels',
    riskLevel: 'CRITICAL',
    securityRequirements: ['bearer_token', 'via_wallet_signature'],
    parameters: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Target user identifier',
        example: 'user123@company.com'
      },
      {
        name: 'permissions',
        type: 'string[]',
        required: true,
        description: 'Permissions to grant or revoke',
        example: ['admin', 'export_data', 'modify_users']
      },
      {
        name: 'action',
        type: 'string',
        required: true,
        description: 'Grant or revoke permissions',
        validation: { enum: ['grant', 'revoke'] }
      },
      {
        name: 'signature',
        type: 'string',
        required: true,
        description: 'VIA wallet signature approving this action'
      }
    ],
    examples: [
      {
        description: 'Grant admin permissions to user',
        request: {
          userId: 'john@company.com',
          permissions: ['admin', 'user_management'],
          action: 'grant',
          signature: '0xfedcba0987654321...'
        },
        expectedResponse: {
          operationId: 'PERM-2024-789',
          status: 'completed',
          userId: 'john@company.com',
          newPermissions: ['admin', 'user_management', 'read', 'write']
        }
      }
    ]
  },

  {
    path: '/api/sensitive/financial-transaction',
    method: 'POST',
    category: 'sensitive',
    description: 'Process financial transactions and payments',
    riskLevel: 'CRITICAL',
    securityRequirements: ['bearer_token', 'via_wallet_signature'],
    parameters: [
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Transaction amount in USD',
        example: 1500.00
      },
      {
        name: 'recipient',
        type: 'string',
        required: true,
        description: 'Payment recipient identifier',
        example: 'vendor@supplier.com'
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        description: 'Transaction type',
        example: 'payment',
        validation: { enum: ['payment', 'refund', 'transfer', 'bonus'] }
      },
      {
        name: 'reference',
        type: 'string',
        required: false,
        description: 'Transaction reference or invoice number',
        example: 'INV-2024-456'
      },
      {
        name: 'signature',
        type: 'string',
        required: true,
        description: 'VIA wallet signature approving this financial transaction'
      }
    ],
    examples: [
      {
        description: 'Process vendor payment',
        request: {
          amount: 2500.00,
          recipient: 'vendor@supplier.com',
          type: 'payment',
          reference: 'INV-2024-789',
          signature: '0x9876543210abcdef...'
        },
        expectedResponse: {
          transactionId: 'TXN-2024-123',
          status: 'processing',
          amount: 2500.00,
          recipient: 'vendor@supplier.com',
          estimatedCompletion: '2024-01-15T16:00:00Z'
        }
      }
    ]
  },

  {
    path: '/api/sensitive/deploy-code',
    method: 'POST',
    category: 'sensitive',
    description: 'Deploy code to production or staging environments',
    riskLevel: 'CRITICAL',
    securityRequirements: ['bearer_token', 'via_wallet_signature'],
    parameters: [
      {
        name: 'environment',
        type: 'string',
        required: true,
        description: 'Deployment target environment',
        example: 'production',
        validation: { enum: ['development', 'staging', 'production'] }
      },
      {
        name: 'repository',
        type: 'string',
        required: true,
        description: 'Source code repository',
        example: 'main-application'
      },
      {
        name: 'branch',
        type: 'string',
        required: true,
        description: 'Git branch to deploy',
        example: 'release/v2.1.0'
      },
      {
        name: 'signature',
        type: 'string',
        required: true,
        description: 'VIA wallet signature approving this deployment'
      }
    ],
    examples: [
      {
        description: 'Deploy hotfix to production',
        request: {
          environment: 'production',
          repository: 'main-application',
          branch: 'hotfix/critical-security-patch',
          signature: '0x1122334455667788...'
        },
        expectedResponse: {
          deploymentId: 'DEP-2024-999',
          status: 'initiated',
          environment: 'production',
          estimatedDuration: '15 minutes'
        }
      }
    ]
  }
];

/**
 * Complete API Catalog
 */
export const ALL_ENDPOINTS: EndpointConfig[] = [
  ...REGULAR_ENDPOINTS,
  ...SENSITIVE_ENDPOINTS
];

/**
 * Utility Functions
 */
export const getEndpointByPath = (path: string): EndpointConfig | undefined => {
  return ALL_ENDPOINTS.find(endpoint => endpoint.path === path);
};

export const getEndpointsByCategory = (category: 'regular' | 'sensitive'): EndpointConfig[] => {
  return ALL_ENDPOINTS.filter(endpoint => endpoint.category === category);
};

export const generateLLMSystemPrompt = (): string => {
  const regularEndpoints = getEndpointsByCategory('regular');
  const sensitiveEndpoints = getEndpointsByCategory('sensitive');

  let prompt = `You are an API query generator for a business system. Convert user requests into appropriate API calls.

AVAILABLE API ENDPOINTS:

=== REGULAR ENDPOINTS (Standard authentication only) ===
`;

  regularEndpoints.forEach(endpoint => {
    prompt += `${endpoint.method} ${endpoint.path}
- Purpose: ${endpoint.description}
- Parameters: ${JSON.stringify(endpoint.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.example }), {}), null, 2)}
- Max records: ${endpoint.maxRecords || 'N/A'}
- Example: ${JSON.stringify(endpoint.examples[0]?.request || {}, null, 2)}

`;
  });

  prompt += `=== SENSITIVE ENDPOINTS (Require special authorization) ===
`;

  sensitiveEndpoints.forEach(endpoint => {
    // Filter out signature parameters - they should never be included in LLM-generated calls
    const paramsWithoutSignature = endpoint.parameters
      .filter(p => p.name !== 'signature')
      .reduce((acc, p) => ({ ...acc, [p.name]: p.example }), {});

    // Create example without signature field
    const exampleWithoutSignature = { ...(endpoint.examples[0]?.request || {}) };
    delete exampleWithoutSignature.signature;

    prompt += `${endpoint.method} ${endpoint.path}
- Purpose: ${endpoint.description}
- Risk Level: ${endpoint.riskLevel}
- Parameters: ${JSON.stringify(paramsWithoutSignature, null, 2)}
- Example: ${JSON.stringify(exampleWithoutSignature, null, 2)}

`;
  });

  prompt += `INSTRUCTIONS:
1. Choose the most appropriate endpoint for the user's request
2. Use regular endpoints when possible - they're faster and don't require special approval
3. Only use sensitive endpoints for bulk operations, external communication, or high-privilege actions
4. Generate realistic parameters based on the user's request
5. If the request is ambiguous, use your best judgment to fulfill the user's apparent intent
6. CRITICAL: NEVER include "signature" parameters in your generated API calls - the system will handle signature validation separately

Response format: Return a JSON array of API calls:
[
  {
    "endpoint": "/api/regular/user-lookup",
    "method": "POST",
    "params": {"userId": "example@company.com"},
    "reasoning": "User asked to look up a specific user"
  }
]`;

  return prompt;
};

export default {
  REGULAR_ENDPOINTS,
  SENSITIVE_ENDPOINTS,
  ALL_ENDPOINTS,
  getEndpointByPath,
  getEndpointsByCategory,
  generateLLMSystemPrompt
};