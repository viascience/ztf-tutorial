[Skip to content](#ztf-keycloak-integration-tutorial)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

Getting Started Tutorial

Initializing search

* [Zero Trust Fabric (ZTF)](..)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")
ZTF Product Documentation

* Zero Trust Fabric (ZTF)

  Zero Trust Fabric (ZTF)
  + [Documentation Overview](..)
  + Getting Started Tutorial

    [Getting Started Tutorial](./)

    Table of contents
    - [Overview](#overview)
    - [Prerequisites](#prerequisites)
    - [Keycloak Configuration](#keycloak-configuration)

      * [Server Details](#server-details)
      * [Client Configuration in Keycloak](#client-configuration-in-keycloak)
    - [Installation & Setup](#installation-setup)

      * [1. Get the Tutorial Code](#1-get-the-tutorial-code)
      * [2. Dependencies](#2-dependencies)
      * [2. Configure Keycloak Client](#2-configure-keycloak-client)
    - [Application Structure](#application-structure)

      * [Core Files](#core-files)
      * [Key Components](#key-components)

        + [1. Keycloak Initialization (src/App.tsx)](#1-keycloak-initialization-srcapptsx)
        + [2. Token Management (src/App.tsx)](#2-token-management-srcapptsx)
        + [3. Logout Functionality (src/App.tsx)](#3-logout-functionality-srcapptsx)
    - [Development Setup](#development-setup)

      * [1. Build and Run with Docker](#1-build-and-run-with-docker)
      * [2. Build and Run with Docker Compose](#2-build-and-run-with-docker-compose)
      * [3. CORS Configuration for Development](#3-cors-configuration-for-development)
    - [Production Deployment](#production-deployment)

      * [1. Docker Build](#1-docker-build)
      * [2. Docker Run](#2-docker-run)
      * [3. Production CORS Configuration](#3-production-cors-configuration)
    - [Authentication Flow](#authentication-flow)

      * [1. Initial Load](#1-initial-load)
      * [2. Login Process](#2-login-process)
      * [3. Token Management](#3-token-management)
      * [4. Logout Process](#4-logout-process)
    - [User Information Access](#user-information-access)
    - [API Integration](#api-integration)
    - [Error Handling](#error-handling)

      * [1. Initialization Errors](#1-initialization-errors)
      * [2. Authentication Errors](#2-authentication-errors)
      * [3. Token Refresh Errors](#3-token-refresh-errors)
    - [Troubleshooting](#troubleshooting)

      * [Common Issues](#common-issues)
      * [Debug Mode](#debug-mode)
    - [Security Considerations](#security-considerations)
    - [Support](#support)
    - [Additional Resources](#additional-resources)
  + [VIA ZTF Overview](../via-ztf-overview/)
  + [VIA ZTF Components](../via-ztf-components/)
  + [Additional Supporting Components](../additional-components/)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + [VIA ZTF Setup and Integration](../integration/)
  + [Glossary](../glossary/)
  + [Definitions](../definitions/)

# ZTF Keycloak Integration Tutorial[¶](#ztf-keycloak-integration-tutorial "Permanent link")

This tutorial demonstrates how to integrate ZTF (Zero Trust Fabric) Keycloak authentication into a React application. This example shows a complete passwordless authentication flow using the Authorization Code Flow with PKCE (Proof Key for Code Exchange).

**Tutorial 1 Code Repository**: The complete working code for this tutorial is available at <https://github.com/viascience/ztf-tutorial>. Clone this repository to follow along with the tutorial and test the implementation.

## Overview[¶](#overview "Permanent link")

This application demonstrates:

* Passwordless authentication using Keycloak
* JWT token management and automatic refresh
* Secure logout functionality
* CORS configuration for production deployment
* Docker containerization with nginx

## Prerequisites[¶](#prerequisites "Permanent link")

* Node.js (version 18 or higher)
* npm or yarn
* Access to a ZTF Keycloak instance (use the default configuration provided in this tutorial or contact VIA to get a production setup for your application)
* Basic understanding of React and OAuth 2.0/OpenID Connect

## Keycloak Configuration[¶](#keycloak-configuration "Permanent link")

### Server Details[¶](#server-details "Permanent link")

* **Keycloak URL**: `https://auth.solvewithvia.com/auth`
* **Realm**: `ztf_demo`
* **Client ID**: `localhost-app` (pre-configured for local development)

### Client Configuration in Keycloak[¶](#client-configuration-in-keycloak "Permanent link")

The `localhost-app` client is pre-configured for development.

## Installation & Setup[¶](#installation-setup "Permanent link")

### 1. Get the Tutorial Code[¶](#1-get-the-tutorial-code "Permanent link")

First, clone the tutorial repository containing the complete working code:

|  |  |
| --- | --- |
| ``` 1 2 ``` | ``` git clone https://github.com/viascience/ztf-tutorial.git cd ztf-tutorial  ``` |

### 2. Dependencies[¶](#2-dependencies "Permanent link")

All dependencies are automatically installed during the Docker build process. The project uses these essential packages (as defined in `package.json`):

* `keycloak-js`: ^25.0.6 - Keycloak JavaScript adapter
* `react`: ^18.2.0 - React framework
* `react-dom`: ^18.2.0 - React DOM renderer
* `http-proxy-middleware`: ^2.0.6 - Development CORS proxy

### 2. Configure Keycloak Client[¶](#2-configure-keycloak-client "Permanent link")

Update the Keycloak configuration in `src/App.tsx`:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 ``` | ``` const keycloak = new Keycloak({   url: "https://auth.solvewithvia.com/auth",   realm: "ztf_demo",   clientId: "localhost-app", // Default client ID for local development });  ``` |

**Note for Production**: For production deployments, use environment variables instead of hardcoded values to configure Keycloak settings.

## Application Structure[¶](#application-structure "Permanent link")

### Core Files[¶](#core-files "Permanent link")

* **`src/App.tsx`** - Main application component with Keycloak integration
* **`src/setupProxy.js`** - Development CORS configuration
* **`nginx.conf`** - Production CORS configuration
* **`public/silent-check-sso.html`** - Silent SSO check for iframe-based authentication
* **`Dockerfile`** - Container configuration for production deployment

### Key Components[¶](#key-components "Permanent link")

#### 1. Keycloak Initialization (`src/App.tsx`)[¶](#1-keycloak-initialization-srcapptsx "Permanent link")

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 10 11 12 13 ``` | ``` keycloak.init({   onLoad: "login-required",   redirectUri: window.location.origin + "/",   checkLoginIframe: false,   responseMode: "query",   pkceMethod: "S256",   enableLogging: true,   scope: "openid profile email",   checkLoginIframeInterval: 0,   messageReceiveTimeout: 10000,   flow: "standard",   useNonce: true, });  ``` |

**Key Configuration Options:**

* `onLoad: "login-required"` - Automatically redirect to login if not authenticated
* `pkceMethod: "S256"` - Use PKCE for secure authentication
* `useNonce: true` - Enabled for better security with nonce validation
* `checkLoginIframe: false` - Disabled for better compatibility with modern browsers that block cross-origin iframe communication and CSP restrictions

#### 2. Token Management (`src/App.tsx`)[¶](#2-token-management-srcapptsx "Permanent link")

The application includes automatic token refresh:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 10 11 12 13 14 ``` | ``` const setupTokenRefresh = () => {   keycloak     .updateToken(70)     .then((refreshed) => {       if (refreshed) {         console.log("Token refreshed");       }       setCurrentToken(keycloak.token);       setLastTokenUpdate(new Date());     })     .catch((error) => {       keycloak.login(); // Redirect to login if refresh fails     }); };  ``` |

#### 3. Logout Functionality (`src/App.tsx`)[¶](#3-logout-functionality-srcapptsx "Permanent link")

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 ``` | ``` const handleLogout = () => {   setCurrentToken(undefined);   setAuthenticated(false);   keycloak.logout({     redirectUri: window.location.origin + "/",   }); };  ``` |

## Development Setup[¶](#development-setup "Permanent link")

### 1. Build and Run with Docker[¶](#1-build-and-run-with-docker "Permanent link")

To run the ZTF integration tutorial locally, ensure you're in the cloned repository directory and use the following Docker commands:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 ``` | ``` # Build the Docker image (--no-cache ensures a fresh build) docker build --no-cache -t ztf-tutorial-1 .  # Run the container on port 80 docker run -p 80:80 ztf-tutorial-1  ``` |

The application will start on `http://localhost:80` and be ready for ZTF Keycloak authentication.

### 2. Build and Run with Docker Compose[¶](#2-build-and-run-with-docker-compose "Permanent link")

For simplified deployment and management, use Docker Compose:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 10 11 ``` | ``` # Build and start the application docker-compose up --build  # Run in detached mode (background) docker-compose up -d --build  # Stop the application docker-compose down  # View logs docker-compose logs -f  ``` |

The application will start on `http://localhost:80` and be ready for ZTF Keycloak authentication.

### 3. CORS Configuration for Development[¶](#3-cors-configuration-for-development "Permanent link")

The `src/setupProxy.js` file configures CORS headers for development:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 ``` | ``` app.use((req, res, next) => {   res.header("Access-Control-Allow-Origin", "*");   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");   res.header(     "Access-Control-Allow-Headers",     "Origin,X-Requested-With,Content-Type,Accept,Authorization"   );   // Handle preflight requests });  ``` |

## Production Deployment[¶](#production-deployment "Permanent link")

### 1. Docker Build[¶](#1-docker-build "Permanent link")

|  |  |
| --- | --- |
| ``` 1 ``` | ``` docker build --no-cache -t ztf-tutorial-1 .  ``` |

### 2. Docker Run[¶](#2-docker-run "Permanent link")

|  |  |
| --- | --- |
| ``` 1 ``` | ``` docker run -p 80:80 ztf-tutorial-1  ``` |

### 3. Production CORS Configuration[¶](#3-production-cors-configuration "Permanent link")

The `nginx.conf` file includes production-ready CORS configuration:

|  |  |
| --- | --- |
| ``` 1 2 ``` | ``` add_header 'Access-Control-Allow-Origin' 'https://auth.solvewithvia.com' always; add_header 'Access-Control-Allow-Credentials' 'true' always;  ``` |

## Authentication Flow[¶](#authentication-flow "Permanent link")

### 1. Initial Load[¶](#1-initial-load "Permanent link")

1. Application initializes Keycloak client
2. Checks for existing authentication state
3. If not authenticated, redirects to Keycloak login page

### 2. Login Process[¶](#2-login-process "Permanent link")

1. User is redirected to ZTF Keycloak login page
2. User authenticates (passwordless flow)
3. Keycloak redirects back with authorization code
4. Application exchanges code for JWT using PKCE

### 3. Token Management[¶](#3-token-management "Permanent link")

1. Application stores JWT
2. Automatically refreshes tokens every 5 minutes if they expire within 350 seconds
3. Displays current token information and user details

### 4. Logout Process[¶](#4-logout-process "Permanent link")

1. Clears local token state
2. Redirects to Keycloak logout endpoint
3. Keycloak performs global logout and redirects back to application

## User Information Access[¶](#user-information-access "Permanent link")

Once authenticated, you can access user information from the JWT token:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 ``` | ``` // User details from token const username = keycloak.tokenParsed?.preferred_username; const name = keycloak.tokenParsed?.name; const email = keycloak.tokenParsed?.email; const userId = keycloak.tokenParsed?.sub;  // Roles and permissions const realmAccess = keycloak.realmAccess; const resourceAccess = keycloak.resourceAccess;  ``` |

## API Integration[¶](#api-integration "Permanent link")

To make authenticated API calls, include the JWT token in the Authorization header:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 ``` | ``` const makeAuthenticatedRequest = async () => {   try {     const response = await fetch("/api/protected-endpoint", {       method: "GET",       headers: {         Authorization: `Bearer ${keycloak.token}`,         "Content-Type": "application/json",       },     });      if (response.status === 401) {       // Token might be expired, try to refresh       await keycloak.updateToken(30);       // Retry the request with new token     }      return response.json();   } catch (error) {     console.error("API request failed:", error);   } };  ``` |

## Error Handling[¶](#error-handling "Permanent link")

The application includes comprehensive error handling:

### 1. Initialization Errors[¶](#1-initialization-errors "Permanent link")

* Network connectivity issues
* Invalid client configuration
* Keycloak server unavailability

### 2. Authentication Errors[¶](#2-authentication-errors "Permanent link")

* Invalid credentials
* Expired sessions
* Token exchange failures

### 3. Token Refresh Errors[¶](#3-token-refresh-errors "Permanent link")

* Network failures during refresh
* Invalid refresh tokens
* Server-side token revocation

## Troubleshooting[¶](#troubleshooting "Permanent link")

### Common Issues[¶](#common-issues "Permanent link")

1. **"Invalid nonce" errors**: If you encounter nonce validation errors, ensure your keycloak-js version matches your Keycloak deployment version. Current configuration uses `useNonce: true` with Keycloak 25.0.6
2. **CORS errors**: Check that your domain is added to Keycloak client's Web Origins
3. **Redirect URI mismatch**: Verify Valid Redirect URIs in Keycloak client configuration
4. **Token refresh failures**: Check network connectivity and Keycloak server status

### Debug Mode[¶](#debug-mode "Permanent link")

Enable detailed logging by setting `enableLogging: true` in Keycloak initialization. Check browser console for detailed authentication flow information.

## Security Considerations[¶](#security-considerations "Permanent link")

1. **PKCE**: Always use PKCE for public clients (single-page applications)
2. **Token Storage**: Tokens are stored in memory, not localStorage, for better security
3. **HTTPS**: Always use HTTPS in production for secure token transmission
4. **CORS**: Configure restrictive CORS policies in production
5. **Token Validation**: Implement proper token validation on your backend services

## Support[¶](#support "Permanent link")

For issues related to:

* **ZTF Keycloak configuration**: Contact ZTF support team or visit the [GitHub Issues page](https://github.com/viascience/ztf-tutorial/issues)
* **Application integration**: Refer to Keycloak.js documentation
* **This tutorial**: Create an issue in the project repository

## Additional Resources[¶](#additional-resources "Permanent link")

* [Keycloak Documentation](https://www.keycloak.org/documentation)
* [Keycloak.js Reference](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
* [OAuth 2.0 PKCE RFC](https://tools.ietf.org/html/rfc7636)
* [OpenID Connect Specification](https://openid.net/connect/)

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
