# VIA Step Up Authentication Tutorial

This tutorial demonstrates how to integrate step up authentication in your applications by leveraging WalletConnect session recovery from Keycloak authentication and transaction sending to the VIA wallet in a React application. This example shows a complete Web3 flow using WalletConnect v2 with automatic configuration and session management through Keycloak.

If you are wondering why this tutorial is relevant to you, if you want to protect your users' sensitive actions from automated agents, this tutorial will help you create your apps with the necessary security requirements. In particular, we will be protecting our users by requesting step up authentication from their VIA wallet for sensitive actions.

## Overview

This application demonstrates:
- **Automatic WalletConnect Configuration**: WalletConnect settings are automatically retrieved from the Keycloak user info endpoint - no manual configuration needed
- **Seamless Session Recovery**: WalletConnect sessions are automatically restored from user profile data
- **VIA Wallet Integration**: Direct integration with VIA wallet infrastructure
- **Transaction Management**: Create and sign transactions through WalletConnect
- **Persistent Authentication**: Session state management across browser refreshes
- **Security-First Data Storage**: Sensitive data automatically clears when browser session ends
- **Containerized Deployment**: Ready-to-run Docker container with nginx

## Prerequisites

- **Docker**: Required for running the containerized application
- [**ZTF documentation**](https://www.solvewithvia.com/via-ztf/): To learn more about Zero Trust Fabric. 
- **Basic Knowledge**: Understanding of React, Web3, and WalletConnect concepts

## How It Works

### Automatic Configuration System

Unlike traditional WalletConnect integrations, this application **automatically retrieves all configuration** from your ZTF user profile:

1. **Authentication**: User logs in through Keycloak
2. **Profile Fetching**: App automatically calls the Keycloak userinfo endpoint
3. **Configuration Extraction**: WalletConnect settings and session data are extracted from user profile
4. **Session Recovery**: If a previous session exists, it's automatically restored

**No manual configuration required** - everything is handled automatically based on your ZTF account settings.

### Server Configuration
- **Keycloak URL**: `https://auth.solvewithvia.com/auth`
- **Realm**: `ztf_demo`
- **Client ID**: `localhost-app` (pre-configured for local development)

## Quick Start

### Method 1: Docker (Recommended)

The fastest way to run the application:

```bash
# Clone the repository (if not already done)
cd tutorial-2-step-up-auth

# Build and run with Docker
docker build -t ztf-tutorial-2 .
docker run -p 80:80 ztf-tutorial-2
```

The application will be available at `http://localhost`

### Method 2: Docker Compose

For easier management:

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop the application
docker-compose down
```

### Method 3: Development Mode

For development with hot reload:

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3000`

## Application Structure

### Core Files

- **`src/App.tsx`** - Main application component with Keycloak authentication and provider setup
- **`src/ConfigService.tsx`** - Automatically fetches configuration from Keycloak userinfo endpoint
- **`src/WalletConnectProvider.tsx`** - WalletConnect session management and recovery
- **`src/TransactionService.tsx`** - Transaction creation and signing interface
- **`src/TransactionDemo.tsx`** - Demo UI for testing transactions
- **`src/WalletConnectionStatus.tsx`** - Shows current connection status
- **`src/setupProxy.js`** - Development CORS configuration
- **`nginx.conf`** - Production CORS configuration
- **`Dockerfile`** - Container configuration for production deployment

### Application Flow

#### 1. Authentication & Configuration Loading (`src/App.tsx` + `src/ConfigService.tsx`)

```typescript
// 1. Initialize Keycloak authentication
keycloak.init({
  onLoad: "login-required",
  redirectUri: window.location.origin + "/",
  checkLoginIframe: false,
  responseMode: "query",
  pkceMethod: "S256",
  scope: "openid profile email"
}).then((authenticated) => {
  if (authenticated) {
    // 2. Load app configuration automatically
    loadAppConfig(keycloak);
  }
});

// 3. ConfigService fetches user info and WalletConnect config
const loadAppConfig = async (keycloak) => {
  const userInfoUrl = `https://auth.solvewithvia.com/auth/realms/ztf_demo/protocol/openid-connect/userinfo`;

  const response = await fetch(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${keycloak.token}`,
      'Content-Type': 'application/json'
    }
  });

  const userInfoData = await response.json();

  // Extract and decode WalletConnect session info
  if (userInfoData.walletConnectSessionInfo) {
    const decodedString = atob(userInfoData.walletConnectSessionInfo);
    const walletConnectInfo = JSON.parse(decodedString);
    setWalletConnectInfo(walletConnectInfo);
  }
};
```

#### 2. Automatic WalletConnect Initialization

```typescript
// When configuration is loaded, automatically initialize WalletConnect
useEffect(() => {
  if (isInitialized && walletConnectInfo && authenticated && !sessionInitialized) {
    initializeWithSessionInfo(walletConnectInfo);
    setSessionInitialized(true);
  }
}, [isInitialized, walletConnectInfo, authenticated]);
```

#### 3. Transaction Management (`src/TransactionService.tsx`)

```typescript
const sendTransaction = async (transactionData) => {
  if (!walletConnect || !session) {
    throw new Error('WalletConnect not initialized or no active session');
  }

  const transaction = {
    from: session.namespaces.eip155.accounts[0].split(':')[2],
    to: transactionData.to,
    value: transactionData.value,
    data: transactionData.data || "0x"
  };

  const result = await walletConnect.request({
    topic: session.topic,
    chainId: "eip155:1",
    request: {
      method: "eth_sendTransaction",
      params: [transaction]
    }
  });

  return result;
};
```

## What You'll See

### Application Features

Once running, the application provides:

1. **Passwordless Login**: Redirects to Keycloak authentication
2. **Dashboard**: Shows authenticated user information
3. **WalletConnect Status**: Displays current connection status
4. **Transaction Demo**: Interface to test sending transactions
5. **Session Persistence**: Maintains connection across browser refreshes

### User Interface

- **User Info**: Shows authenticated username and last login time
- **Connection Status**: Indicates if WalletConnect session is active
- **Transaction Form**: Allows testing different transaction types
- **Logout Button**: Clears session and returns to login

## Understanding the Architecture

### Automatic Configuration Flow

1. **User Login** → Keycloak authentication
2. **Config Fetch** → App calls `/userinfo` endpoint automatically
3. **Data Extraction** → WalletConnect settings extracted from user profile
4. **Session Recovery** → If previous session exists, it's restored automatically
5. **Ready to Use** → Application is immediately ready for transactions

### Key Benefits

- **Zero Configuration**: No manual WalletConnect setup required
- **Seamless UX**: Users don't need to reconnect wallets manually
- **Enterprise Ready**: Integrates with existing ZTF infrastructure
- **Session Persistence**: Survives browser refreshes and restarts

## Configuration Details

### What Gets Configured Automatically

The application automatically retrieves from your ZTF profile:

- **WalletConnect Project ID**: Extracted from user profile
- **Session Information**: Previous WalletConnect sessions
- **User Preferences**: Network settings and wallet configuration
- **Public Keys**: Associated wallet addresses
- **Organization Data**: Company and user type information

### Data Storage Security

The application uses different storage mechanisms based on data sensitivity:

```typescript
// Non-sensitive data in localStorage (persists across sessions)
localStorage.setItem('publicKey', userPublicKey);          // Public key - safe to persist
localStorage.setItem('orgName', userInfoData.organization_name);  // Organization name

// Sensitive data in sessionStorage (clears when tab closes)
sessionStorage.setItem('userType', userInfoData.user_type);      // User role/privileges
sessionStorage.setItem('dataItemId', dataItemId);               // Transaction identifiers
```

This approach balances user experience with security by keeping public information available while ensuring sensitive data is automatically cleared when the browser session ends.

#### Security Benefits
- **Reduced XSS Risk**: Sensitive data has limited exposure window
- **Automatic Cleanup**: No sensitive data persists after browser session
- **Minimal Attack Surface**: Only public/non-sensitive data remains in persistent storage
- **Zero Configuration**: Security measures work automatically without user intervention

## Transaction Flow

### Complete Transaction Process

1. **User Action**: User fills transaction form in the demo
2. **Validation**: App validates transaction parameters
3. **WalletConnect Request**: Sends transaction to connected wallet
4. **User Approval**: User approves transaction in VIA wallet
5. **Blockchain Submission**: Transaction is submitted to the network
6. **Result Display**: Transaction hash and status shown in UI

### Transaction Types Supported

- **VSC Type with Personal Sign**: Message signing and verification

> **⚠️ PRODUCTION SECURITY NOTE**: Before deploying to production, you must implement backend signature verification. Your backend endpoint must extract the public key from the JWT token and verify that the signature matches the authenticated user's public key. Additionally, to avoid replay attacks on sensitive actions, the backend should first provide a one-time ID for each action that gets signed by the wallet.

### Agentic Browser Protection Use Case

This tutorial's signature-based approach becomes critical in agentic browser environments where AI agents can interact with web applications autonomously:

**The Risk**: An agentic browser interacting with any web application with sensitive actions could potentially:
- Navigate to sensitive pages automatically
- Fill out financial or administrative forms
- Submit requests to backend APIs without user awareness
- Perform critical actions the user never explicitly intended to authorize

**How This Tutorial Protects Users**:
1. **Wallet-Level Confirmation**: Every sensitive action requires explicit wallet signature approval
2. **User Awareness**: The VIA wallet shows exactly what the user is signing
3. **Cannot Be Automated**: Agentic browsers cannot access private keys or auto-approve wallet signatures

**Production Implementation Benefits**:
- **Backend Verification**: Ensures signatures come from the authenticated user's actual wallet
- **One-Time Action IDs**: Prevents replay attacks even if an agent captures previous signatures
- **Audit Trail**: Clear record of what users actually approved vs. what agents attempted

**Example Flow**:
```
Agentic Browser → Fills form → Submits to backend
                                     ↓
Backend → Generates unique action ID → Returns to frontend
                                     ↓
Frontend → Prompts VIA wallet → User sees "Sign action: withdraw_funds_xyz123"
                                     ↓
User → Explicitly approves/rejects → Only then does backend process the action
```

This ensures users maintain control over sensitive actions even when using AI-powered browsing tools.

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check Docker status
docker ps

# View container logs
docker logs <container-id>

# Rebuild without cache
docker build --no-cache -t ztf-tutorial-2 .
```

#### 2. Authentication Issues
- **Keycloak Login Fails**: Check network connectivity to `auth.solvewithvia.com`
- **Token Refresh Issues**: Clear browser cache and cookies
- **Redirect Problems**: Verify you're accessing the app on the correct port

#### 3. WalletConnect Issues
- **No Configuration Found**: Ensure your ZTF account has WalletConnect settings configured
- **Connection Timeout**: Check VIA wallet availability and network connectivity

#### 4. Transaction Problems
- **Transaction Rejected**: Verify wallet has sufficient balance and gas
- **Network Errors**: Check blockchain network status
- **Invalid Parameters**: Ensure transaction data is properly formatted

### Debug Information

Enable browser developer tools to see detailed logs:

1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Look for network requests in Network tab
4. Check Application > Storage to inspect cached data:
   - **LocalStorage**: Contains non-sensitive data (publicKey, orgName)
   - **SessionStorage**: Contains sensitive data (userType, dataItemId)

### Reset Application State

If you encounter persistent issues:

```bash
# Clear browser data (choose one method):
# Method 1: Clear all site data
# Open DevTools → Application → Storage → Clear site data

# Method 2: Clear specific storage
# DevTools → Application → LocalStorage → Delete specific keys
# DevTools → Application → SessionStorage → Delete specific keys

# Method 3: Use incognito/private browsing mode

# Restart container
docker stop <container-id>
docker start <container-id>
```

**Note**: SessionStorage (sensitive data) automatically clears when you close the browser tab, while LocalStorage (non-sensitive data) persists until manually cleared.

## Project Structure

```
tutorial-2-step-up-auth/
├── src/
│   ├── App.tsx                    # Main app with authentication
│   ├── ConfigService.tsx          # Automatic config from userinfo
│   ├── WalletConnectProvider.tsx  # WalletConnect session management
│   ├── TransactionService.tsx     # Transaction handling
│   ├── TransactionDemo.tsx        # Transaction UI demo
│   ├── WalletConnectionStatus.tsx # Connection status display
│   └── setupProxy.js              # Development CORS proxy
├── public/                        # Static assets
├── Dockerfile                     # Container configuration
├── nginx.conf                     # Production web server config
├── docker-compose.yml             # Docker compose setup
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## Dependencies

### Core Dependencies (package.json)
- **react**: ^18.2.0 - React framework
- **keycloak-js**: ^25.0.6 - Keycloak authentication
- **@walletconnect/sign-client**: 2.13.3 - WalletConnect v2 client
- **@walletconnect/utils**: 2.13.3 - WalletConnect utilities
- **@walletconnect/types**: 2.13.3 - WalletConnect type definitions
- **ethers**: ^5.7.2 - Ethereum library

### Development Dependencies
- **typescript**: ^5.0.0 - TypeScript support
- **http-proxy-middleware**: ^2.0.6 - Development proxy for CORS

## Support & Resources

### Getting Help
For technical issues, questions, or bug reports, please create an issue in the [GitHub repository](https://github.com/viascience/ztf-tutorial/issues).

### Useful Resources
- [React Documentation](https://reactjs.org/docs/)
- [Keycloak JavaScript Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [Docker Documentation](https://docs.docker.com/)
- [Ethereum Development](https://ethereum.org/developers/)
- [ZTF Documentation](https://www.solvewithvia.com/via-ztf/)


### Next Steps
After running this tutorial successfully, you are all set to be able to modify the transaction demo for your specific use case.
