# ZTF Keycloak Integration Tutorial

This tutorial demonstrates how to integrate ZTF (Zero Trust Fabric) Keycloak authentication into a React application. This example shows a complete passwordless authentication flow using the Authorization Code Flow with PKCE (Proof Key for Code Exchange).

## Overview

This application demonstrates:
- Passwordless authentication using Keycloak
- JWT token management and automatic refresh
- Secure logout functionality
- CORS configuration for production deployment
- Docker containerization with nginx

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Access to a ZTF Keycloak instance (use the default configuration provided in this tutorial or contact VIA to get a production setup for your application)
- Basic understanding of React and OAuth 2.0/OpenID Connect

## Keycloak Configuration

### Server Details
- **Keycloak URL**: `https://auth.solvewithvia.com/auth`
- **Realm**: `ztf_demo`
- **Client ID**: `localhost-app` (pre-configured for local development)

### Client Configuration in Keycloak

The `localhost-app` client is pre-configured for development. 

## Installation & Setup

### 1. Dependencies

All dependencies are automatically installed during the Docker build process. The project uses these essential packages (as defined in `package.json`):

- `keycloak-js`: ^23.0.1 - Keycloak JavaScript adapter
- `react`: ^18.2.0 - React framework  
- `react-dom`: ^18.2.0 - React DOM renderer
- `http-proxy-middleware`: ^2.0.6 - Development CORS proxy

### 2. Configure Keycloak Client

Update the Keycloak configuration in `src/App.tsx`:

```typescript
const keycloak = new Keycloak({
  url: "https://auth.solvewithvia.com/auth",
  realm: "ztf_demo",
  clientId: "localhost-app", // Default client ID for local development
});
```

## Application Structure

### Core Files

- **`src/App.tsx`** - Main application component with Keycloak integration
- **`src/setupProxy.js`** - Development CORS configuration
- **`nginx.conf`** - Production CORS configuration
- **`public/silent-check-sso.html`** - Silent SSO check for iframe-based authentication
- **`Dockerfile`** - Container configuration for production deployment

### Key Components

#### 1. Keycloak Initialization (`src/App.tsx:68-81`)

```typescript
keycloak.init({ 
  onLoad: "login-required",
  redirectUri: window.location.origin + "/",
  checkLoginIframe: false,
  responseMode: "query",
  pkceMethod: "S256",
  enableLogging: true,
  scope: "openid profile email",
  checkLoginIframeInterval: 0,
  messageReceiveTimeout: 10000,
  flow: "standard",
  useNonce: false
})
```

**Key Configuration Options:**
- `onLoad: "login-required"` - Automatically redirect to login if not authenticated
- `pkceMethod: "S256"` - Use PKCE for secure authentication
- `useNonce: false` - Disabled to prevent nonce validation issues
- `checkLoginIframe: false` - Disabled for better compatibility with modern browsers that block cross-origin iframe communication and CSP restrictions

#### 2. Token Management (`src/App.tsx:41-58`)

The application includes automatic token refresh:

```typescript
const setupTokenRefresh = () => {
  keycloak.updateToken(70).then((refreshed) => {
    if (refreshed) {
      console.log('Token refreshed');
    }
    setCurrentToken(keycloak.token);
    setLastTokenUpdate(new Date());
  }).catch((error) => {
    keycloak.login(); // Redirect to login if refresh fails
  });
};
```

#### 3. Logout Functionality (`src/App.tsx:16-24`)

```typescript
const handleLogout = () => {
  setCurrentToken(undefined);
  setAuthenticated(false);
  keycloak.logout({
    redirectUri: window.location.origin + "/"
  });
};
```

## Development Setup

### 1. Build and Run with Docker

To run the ZTF integration tutorial locally, use the following Docker commands:

```bash
# Build the Docker image (--no-cache ensures a fresh build)
docker build --no-cache -t ztf-tutorial-1 .

# Run the container on port 80
docker run -p 80:80 ztf-tutorial-1
```

The application will start on `http://localhost:80` and be ready for ZTF Keycloak authentication.

### 2. Build and Run with Docker Compose

For simplified deployment and management, use Docker Compose:

```bash
# Build and start the application
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# Stop the application
docker-compose down

# View logs
docker-compose logs -f
```

The application will start on `http://localhost:80` and be ready for ZTF Keycloak authentication.

### 3. CORS Configuration for Development

The `src/setupProxy.js` file configures CORS headers for development:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  // Handle preflight requests
});
```

## Production Deployment

### 1. Docker Build

```bash
docker build --no-cache -t ztf-tutorial-1 .
```

### 2. Docker Run

```bash
docker run -p 80:80 ztf-tutorial-1
```

### 3. Production CORS Configuration

The `nginx.conf` file includes production-ready CORS configuration:

```nginx
add_header 'Access-Control-Allow-Origin' 'https://auth.solvewithvia.com' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

## Authentication Flow

### 1. Initial Load
1. Application initializes Keycloak client
2. Checks for existing authentication state
3. If not authenticated, redirects to Keycloak login page

### 2. Login Process
1. User is redirected to ZTF Keycloak login page
2. User authenticates (passwordless flow)
3. Keycloak redirects back with authorization code
4. Application exchanges code for JWT using PKCE

### 3. Token Management
1. Application stores JWT
2. Automatically refreshes tokens every 5 minutes if they expire within 350 seconds
3. Displays current token information and user details

### 4. Logout Process
1. Clears local token state
2. Redirects to Keycloak logout endpoint
3. Keycloak performs global logout and redirects back to application

## User Information Access

Once authenticated, you can access user information from the JWT token:

```typescript
// User details from token
const username = keycloak.tokenParsed?.preferred_username;
const name = keycloak.tokenParsed?.name;
const email = keycloak.tokenParsed?.email;
const userId = keycloak.tokenParsed?.sub;

// Roles and permissions
const realmAccess = keycloak.realmAccess;
const resourceAccess = keycloak.resourceAccess;
```

## API Integration

To make authenticated API calls, include the JWT token in the Authorization header:

```typescript
const makeAuthenticatedRequest = async () => {
  try {
    const response = await fetch('/api/protected-endpoint', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // Token might be expired, try to refresh
      await keycloak.updateToken(30);
      // Retry the request with new token
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
  }
};
```

## Error Handling

The application includes comprehensive error handling:

### 1. Initialization Errors
- Network connectivity issues
- Invalid client configuration
- Keycloak server unavailability

### 2. Authentication Errors
- Invalid credentials
- Expired sessions
- Token exchange failures

### 3. Token Refresh Errors
- Network failures during refresh
- Invalid refresh tokens
- Server-side token revocation

## Troubleshooting

### Common Issues

1. **"Invalid nonce" errors**: Ensure `useNonce: false` in Keycloak initialization
2. **CORS errors**: Check that your domain is added to Keycloak client's Web Origins
3. **Redirect URI mismatch**: Verify Valid Redirect URIs in Keycloak client configuration
4. **Token refresh failures**: Check network connectivity and Keycloak server status

### Debug Mode

Enable detailed logging by setting `enableLogging: true` in Keycloak initialization. Check browser console for detailed authentication flow information.

## Security Considerations

1. **PKCE**: Always use PKCE for public clients (single-page applications)
2. **Token Storage**: Tokens are stored in memory, not localStorage, for better security
3. **HTTPS**: Always use HTTPS in production for secure token transmission
4. **CORS**: Configure restrictive CORS policies in production
5. **Token Validation**: Implement proper token validation on your backend services

## Support

For issues related to:
- **ZTF Keycloak configuration**: Contact ZTF support team
- **Application integration**: Refer to Keycloak.js documentation
- **This tutorial**: Create an issue in the project repository

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak.js Reference](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [OAuth 2.0 PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect Specification](https://openid.net/connect/)