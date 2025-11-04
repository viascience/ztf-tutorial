[Skip to content](#ztf-set-up-and-integration)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

VIA ZTF Setup and Integration

Initializing search

* [Zero Trust Fabric (ZTF)](..)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")
ZTF Product Documentation

* Zero Trust Fabric (ZTF)

  Zero Trust Fabric (ZTF)
  + [Documentation Overview](..)
  + [Getting Started Tutorial](../tutorial/)
  + [VIA ZTF Overview](../via-ztf-overview/)
  + [VIA ZTF Components](../via-ztf-components/)
  + [Additional Supporting Components](../additional-components/)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + VIA ZTF Setup and Integration

    [VIA ZTF Setup and Integration](./)

    Table of contents
    - [Setup and Configuration of Keycloak into Your Application Using Helm Charts](#setup-and-configuration-of-keycloak-into-your-application-using-helm-charts)
    - [1. How Helm Chart Changes Enable Keycloak Integration](#1-how-helm-chart-changes-enable-keycloak-integration)

      * [What's Happening Behind the Scenes](#whats-happening-behind-the-scenes)
    - [2. Relevant Files and Their Roles](#2-relevant-files-and-their-roles)

      * [a. deployment.yaml](#a-deploymentyaml)
      * [b. values.yaml](#b-valuesyaml)
    - [3. Application Flow After Integration](#3-application-flow-after-integration)
    - [4. Switching to ZTF Authentication](#4-switching-to-ztf-authentication)
    - [5. Summary](#5-summary)
    - [WalletConnectService Usage & Session Recovery Guide](#walletconnectservice-usage-session-recovery-guide)
    - [Core Concepts](#core-concepts)
    - [Key Methods](#key-methods)

      * [1. Initialization](#1-initialization)
      * [2. Sign Client Initialization & Event Binding](#2-sign-client-initialization-event-binding)
      * [3. Session Recovery](#3-session-recovery)
      * [4. Connecting to a Wallet](#4-connecting-to-a-wallet)
      * [5. Sending Requests/Transactions](#5-sending-requeststransactions)
      * [6. Disconnecting](#6-disconnecting)
    - [Detailed Session Recovery Flow](#detailed-session-recovery-flow)
    - [Example: Angular Integration](#example-angular-integration)
    - [Best Practices for Other Apps](#best-practices-for-other-apps)
    - [Summary Table: Session Management Methods](#summary-table-session-management-methods)
    - [Secure User Logout from App, Keycloak, and WalletConnect](#secure-user-logout-from-app-keycloak-and-walletconnect)
    - [Why Is a Complete Logout Important?](#why-is-a-complete-logout-important)
    - [Generalized Flow](#generalized-flow)
    - [Security and UX Tips](#security-and-ux-tips)
    - [Example (Abstracted Pseudocode)](#example-abstracted-pseudocode)
    - [Adapting to Other Frameworks](#adapting-to-other-frameworks)
    - [Summary Checklist](#summary-checklist)
    - [Useful Links](#useful-links)
  + [Glossary](../glossary/)
  + [Definitions](../definitions/)

# ZTF Set Up and Integration[¶](#ztf-set-up-and-integration "Permanent link")

This appendix outlines the technical details for integrating VIA's Zero Trust Fabric (ZTF) with existing applications. It highlights the use of Keycloak for authenticating users and WalletConnect for facilitating blockchain-based transactions. It offers practical guidance and configurations necessary for developers and administrators to successfully implement and deploy ZTF components within their enterprise environments.

## Setup and Configuration of Keycloak into Your Application Using Helm Charts[¶](#setup-and-configuration-of-keycloak-into-your-application-using-helm-charts "Permanent link")

This section explains how to set up and configure the ZTF Keycloak integration for an application using Helm charts. It details the necessary files and clarifies how these changes enable authentication.

These instructions are tailored for integrating with VIA's Keycloak ZTF, which has a specific realm and authentication flow that are not supported by standard Keycloak out of the box. This guide is intended for a fresh installation of ZTF and does not cover the process of importing existing users.

## 1. How Helm Chart Changes Enable Keycloak Integration[¶](#1-how-helm-chart-changes-enable-keycloak-integration "Permanent link")

### What's Happening Behind the Scenes[¶](#whats-happening-behind-the-scenes "Permanent link")

When you configure the following variables in your Helm chart:

* `keycloak.url`
* `keycloak.realm`
* `keycloak.clientId`

Your Helm templates inject these values as environment variables or configuration entries into the Kubernetes manifests for your application. Here's why this works:

* Dynamic Configuration: Helm uses template expressions (e.g., `{{ .Values.keycloak.url }}`) that get replaced with values from your values.yaml or command-line overrides during deployment. This means you can swap authentication providers or credentials without changing your application code—just update your chart values.
* Standard OIDC/OAuth2 Integration: Most modern applications use OpenID Connect (OIDC) or OAuth2 for authentication. These protocols require your app to know:
* Where to send authentication requests (`KEYCLOAK_URL`, usually something like `https://<keycloak-host>/auth`)
* Which realm (user domain) to target (`KEYCLOAK_REALM`)
* Which client ID to identify itself to Keycloak `(KEYCLOAK_CLIENT_ID`)
* Environment Variables: Applications typically read these settings from environment variables or config files injected at runtime. By setting these via the deployment manifest, your app is configured to communicate with Keycloak as an identity provider.

In summary: These Helm chart changes "wire up" your app to Keycloak at runtime, so authentication requests and token verifications are correctly routed and secured.

## 2. Relevant Files and Their Roles[¶](#2-relevant-files-and-their-roles "Permanent link")

### a. deployment.yaml[¶](#a-deploymentyaml "Permanent link")

This template injects the Keycloak config as environment variables into your application pods.

Example snippet:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 ``` | ``` env:   - name: KEYCLOAK_URL     value: {{ .Values.keycloak.url | quote }}   - name: KEYCLOAK_REALM     value: {{ .Values.keycloak.realm | quote }}   - name: KEYCLOAK_CLIENT_ID     value: {{ .Values.keycloak.clientId | quote }}  ``` |

Why this matters: When your app starts, it reads these environment variables to know how to talk to Keycloak for authentication.

### b. values.yaml[¶](#b-valuesyaml "Permanent link")

Holds the default or environment-specific Keycloak settings:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 ``` | ``` keycloak:   enabled: true   url: "https://your-keycloak-server/auth"   realm: "your-realm"   clientId: "your-client-id"  ``` |

Why this matters: This enables flexible, environment-specific configuration—update these values to point to any Keycloak-compatible provider, including ZTF.

## 3. Application Flow After Integration[¶](#3-application-flow-after-integration "Permanent link")

1. Startup: App reads Keycloak variables from its environment.
2. User Authentication: When a user tries to log in, the app redirects them to Keycloak using the configured URL, realm, and client ID.
3. Token Verification: App validates tokens with Keycloak using the provided settings.
4. Switching Providers: To point to ZTF or another Keycloak instance, just update the values (no code changes required).

## 4. Switching to ZTF Authentication[¶](#4-switching-to-ztf-authentication "Permanent link")

To switch to ZTF, update these values (in `values.yaml` or via `helm upgrade --set ...`):

* Keycloak Client ID
* Keycloak Realm
* Keycloak URL

Your application will now use ZTF's Keycloak instance for authentication.

## 5. Summary[¶](#5-summary "Permanent link")

* Helm charts inject Keycloak configuration into your app at deploy-time.
* These variables tell your app where and how to authenticate.
* This method separates configuration from code, improving flexibility and security.

Switching to ZTF or other Keycloak-compatible providers is as simple as updating Helm values.

## WalletConnectService Usage & Session Recovery Guide[¶](#walletconnectservice-usage-session-recovery-guide "Permanent link")

For applications that use blockchain Web3 actions, ZTF allows for wallet-to-dApp communication through WalletConnect. The `WalletConnectService` is an Angular injectable service that simplifies the management of WalletConnect sessions, handling the full session lifecycle from initialization and connection to state monitoring and recovery.

## Core Concepts[¶](#core-concepts "Permanent link")

* **Session** is the persistent connection state between the DApp and the wallet.
* **Pairing** is the handshake process that connects a DApp to a wallet.
* **Session Recovery** ensures that a user can seamlessly restore a previous, valid session after reloading the app or returning later.

## Key Methods[¶](#key-methods "Permanent link")

### 1. Initialization[¶](#1-initialization "Permanent link")

**Purpose**:

* Initialize WalletConnect, possibly with previously stored session data.

**How it works**:

* Clears any existing session data.
* Stores new WalletConnect session info if provided.
* Calls `initializeSignClient()` to set up the client and restore pairing/session if possible.

**Example**:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 ``` | ``` // In your component or main service: constructor(private walletConnectService: WalletConnectService) {}  ngOnInit() {   // Optionally provide wcSessionInfo if restoring from a previous session   this.walletConnectService.initialize(wcSessionInfo); }  ``` |

### 2. Sign Client Initialization & Event Binding[¶](#2-sign-client-initialization-event-binding "Permanent link")

**Method**:

|  |  |
| --- | --- |
| ``` 1 ``` | ``` private initializeSignClient()  ``` |

**Purpose**:

* Instantiates the WalletConnect client.
* Binds to session/pairing events for real-time updates.
* Handles retries and resets on errors.

**How it works**:

* Calls `init()` to start the client with app-specific metadata.
* Binds event handlers for session requests, updates, deletions, etc.
* On error, attempts to reset and reinitialize the client.
* Calls `checkState()` to restore session or pairing if available.

### 3. Session Recovery[¶](#3-session-recovery "Permanent link")

**Method**:

|  |  |
| --- | --- |
| ``` 1 ``` | ``` private checkState()  ``` |

**Purpose**:
Restores previous pairing or session if possible; otherwise, starts a new connection.

**How it works**:

* Gets the last known pairing and session from the sign client's storage.
* If pairing/session found and not expired, attempts to ping the wallet.
* If session expired or not available, sets state to inactive and triggers a new connection if needed.

**Example**:

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 ``` | ``` // After initialization, session recovery is automatic this.walletConnectService.signClientIsInitialized$   .subscribe(isReady => {     if (isReady) {       // Session will be restored if possible, or you can prompt for connection.     }   });  ``` |

### 4. Connecting to a Wallet[¶](#4-connecting-to-a-wallet "Permanent link")

**Method**:

|  |  |
| --- | --- |
| ``` 1 ``` | ``` connect(renew: boolean = false)  ``` |

**Purpose**:
Initiates a new wallet connection or reconnects if required.

**Example**:

|  |  |
| --- | --- |
| ``` 1 2 3 ``` | ``` this.walletConnectService.connect().subscribe(session => {   // Handle successful connection });  ``` |

### 5. Sending Requests/Transactions[¶](#5-sending-requeststransactions "Permanent link")

**Method:**
sendTransaction(request, vscTransaction, apiCall, action)

**Purpose:**
Sends a transaction/request to the wallet via WalletConnect.

**Example:**

|  |  |
| --- | --- |
| ``` 1 2 3 4 ``` | ``` this.walletConnectService.sendTransaction(dcacRequest, vscTx, apiCall, 'create')   .subscribe(response => {     // Handle response   });  ``` |

### 6. Disconnecting[¶](#6-disconnecting "Permanent link")

**Method:**

|  |  |
| --- | --- |
| ``` 1 ``` | ``` disconnect()  ``` |

**Example:**

|  |  |
| --- | --- |
| ``` 1 2 3 ``` | ``` this.walletConnectService.disconnect().subscribe(() => {   // Disconnected });  ``` |

## Detailed Session Recovery Flow[¶](#detailed-session-recovery-flow "Permanent link")

1. App Initialization
2. Call `initialize()` at app startup with optional stored session info.
3. Sign Client Setup
4. `initializeSignClient()` sets up the client, event handlers, and attempts to restore session/pairing.
5. Session/Pairing Check
6. `checkState()` inspects persisted pairing/session from storage.
7. If session exists and is not expired, it pings the wallet to verify connection.
8. If session is invalid/expired, triggers reconnection flow.
9. Event Handling
10. The service listens for WalletConnect events (session request, update, etc.) and updates state accordingly.
11. Recovery on Error
12. On error (e.g., storage corruption, expired session), `resetConnection()` is called to clear state and storage, then the workflow can start anew.

## Example: Angular Integration[¶](#example-angular-integration "Permanent link")

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 ``` | ``` @Component({ ... }) export class MyWalletComponent {   connectionState$ = this.walletConnectService.state$;   walletAddress$ = this.walletConnectService.walletAddress;    constructor(private walletConnectService: WalletConnectService) {}    ngOnInit() {     this.walletConnectService.initialize(/* optional session info */);   }    connectWallet() {     this.walletConnectService.connect().subscribe();   }    sendTx() {     // Fill in required params     this.walletConnectService.sendTransaction(req, vscTx, apiCall, 'create')       .subscribe();   }    disconnect() {     this.walletConnectService.disconnect().subscribe();   } }  ``` |

## Best Practices for Other Apps[¶](#best-practices-for-other-apps "Permanent link")

* Always call initialize() on app startup to recover sessions if available.
* Subscribe to state and error observables to react to connection changes.
* Handle errors gracefully; if session recovery fails, prompt the user to reconnect.
* Use provided observables for reactive UI updates (e.g., wallet address, connection state).
* Bind to WalletConnect events to handle approvals, rejections, and requests in real-time.

## Summary Table: Session Management Methods[¶](#summary-table-session-management-methods "Permanent link")

| Method | Purpose | Typical Usage |
| --- | --- | --- |
| initialize() | Startup/init, session recovery | On app/component init |
| connect(renew?: boolean) | Start (new) connection with wallet | User clicks "Connect Wallet" |
| sendTransaction(...) | Send signed request/transaction | User initiates blockchain action |
| disconnect() | Disconnect and clear session | User clicks "Disconnect" |
| resetConnection() | Internal: force-clears state and storage | On error/expired session |
| state$, walletAddress | Observables for UI binding | Template/UI status display |

Use this service as a reference template for managing WalletConnect sessions in any Angular application. Adjust the injected dependencies, event handling, and request structure as needed to fit your app's requirements.

## Secure User Logout from App, Keycloak, and WalletConnect[¶](#secure-user-logout-from-app-keycloak-and-walletconnect "Permanent link")

When building applications that use ZTF and integrate wallets (e.g., WalletConnect), a secure logout must do the following:

1. End the app session by clearing local state and tokens.
2. Disconnect any wallet sessions, such as those from WalletConnect.
3. Log out from the identity provider (Keycloak), which terminates the global browser session.
4. Redirect the user to a safe post-logout location.

This pattern is adaptable for any frontend, backend, or gateway framework.

## Why Is a Complete Logout Important?[¶](#why-is-a-complete-logout-important "Permanent link")

Logging out of your application alone isn't enough because the user's session with the identity provider will remain unless it's explicitly closed. This can allow logins to persist.

A proper logout process should do the following:

* End the local application session by clearing tokens or cookies.
* Disconnect any wallet sessions.
* Redirect the user to the logout endpoint of the IdPprovider (like Keycloak or another OpenID Connect provider) to end the IdP session.

## Generalized Flow[¶](#generalized-flow "Permanent link")

When a user logs out, the following generalized flow should occur:

1. **User Action**: The user clicks "Logout."
2. **Confirmation**: A confirmation dialog appears. If confirmed by the user, the logout process continues.
3. **Local Cleanup**: The wallet session is disconnected, and any local data, caches, or cookies are cleared.
4. **Redirect to Logout Endpoint**: The user is redirected to the `/logout` endpoint of the application's backend or gateway.
5. Backend/Gateway Process: The `/logout` endpoint extracts the ID token (if available) and redirects the user to Keycloak's logout endpoint with `id_token_hint` and `post_logout_redirect_uri` parameters in the `redirect`.
6. **Global Logout**: Keycloak processes the logout request, ending the global session.
7. **Final Redirect**: The user is redirected back to the application after the global logout is complete.

## Security and UX Tips[¶](#security-and-ux-tips "Permanent link")

* Always clear wallet and application sessions before a logout.
* Use HTTPS for all flows.
* Use confirmation dialogs to prevent accidental logouts.
* Only allow safe domains in `post_logout_redirect_uri` to prevent open redirect attacks.
* Store tokens in `HttpOnly` secure cookies where possible.
* Always test the logout flow to ensure both the application and sessions terminate correctly.

## Example (Abstracted Pseudocode)[¶](#example-abstracted-pseudocode "Permanent link")

|  |  |
| --- | --- |
| ``` 1 2 3 4 5 6 7 ``` | ``` async logout() {   if (await confirm('Log out?')) {     await walletService.disconnect();   // WalletConnect or other     clearLocalSession();     window.location.href = '/logout';   // Gateway/backend will handle SSO logout   } }  ``` |

Backend or Gateway `/logout`:

* Extract ID token from cookie/session
* Redirect to:

|  |  |
| --- | --- |
| ``` 1 ``` | ``` https://keycloak.example.com/realms/your-realm/protocol/openid-connect/logout?id_token_hint=<ID_TOKEN>&post_logout_redirect_uri=https://your-app.com/logout-complete  ``` |

## Adapting to Other Frameworks[¶](#adapting-to-other-frameworks "Permanent link")

This logout pattern can be applied to any web application, regardless of the framework being used (e.g., React, Vue, or Angular). The specific code for disconnecting the wallet will vary depending on the particular integration. The `/logout` endpoint can be implemented in a backend, such as with Node.js, Python, or Java, or within a gateway or proxy.

For Single-Page Applications (SPAs), it is best to manage the logout process through a backend or gateway for enhanced security. This same pattern works with other OpenID Connect (OIDC) providers like Auth0, Okta, and Azure AD. However, the logout endpoint and its parameters will need to be updated to align with their specific documentation.

## Summary Checklist[¶](#summary-checklist "Permanent link")

* Add a logout button with confirmation.
* Disconnect the WalletConnect, or an equivalent, session.
* Clear the application session and local state.
* Redirect to the `/logout` backend or gateway route.
* The backend or gateway redirects to Keycloak with the appropriate parameters.
* The user is redirected back to the application after a global logout.

## Useful Links[¶](#useful-links "Permanent link")

* [Keycloak Documentation: OpenID Connect Logout](https://www.keycloak.org/docs/latest/securing_apps/#logout)
* [OIDC RP-Initiated Logout Spec](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
* [Envoy Proxy: Lua filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/lua_filter)

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
