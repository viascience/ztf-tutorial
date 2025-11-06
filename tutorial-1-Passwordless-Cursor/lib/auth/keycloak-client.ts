// Client-side Keycloak JavaScript adapter
// This handles the OAuth flow in the browser, which works with Keycloak's ZTF plugin

import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://auth.solvewithvia.com/auth',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ztf_demo',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'localhost-app',
};

let keycloakInstance: Keycloak | null = null;

export function getKeycloakInstance(): Keycloak {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
}

export interface KeycloakInitOptions {
  onLoad?: 'login-required' | 'check-sso';
  redirectUri?: string;
  checkLoginIframe?: boolean;
  pkceMethod?: 'S256';
  enableLogging?: boolean;
}

export async function initKeycloak(options: KeycloakInitOptions = {}) {
  const keycloak = getKeycloakInstance();
  
  const defaultOptions = {
    onLoad: 'check-sso' as const,
    redirectUri: window.location.origin + '/',
    checkLoginIframe: false,
    responseMode: 'query' as const,
    pkceMethod: 'S256' as const,
    enableLogging: true,
    scope: 'openid profile email',
    flow: 'standard' as const,
    useNonce: true,
  };

  const initOptions = { ...defaultOptions, ...options };

  try {
    const authenticated = await keycloak.init(initOptions);
    console.log('Keycloak initialized:', { authenticated });
    return { authenticated, keycloak };
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    throw error;
  }
}

export async function loginWithKeycloak() {
  const keycloak = getKeycloakInstance();
  await keycloak.login({
    redirectUri: window.location.origin + '/',
  });
}

export async function logoutFromKeycloak() {
  const keycloak = getKeycloakInstance();
  await keycloak.logout({
    redirectUri: window.location.origin + '/',
  });
}

export function getKeycloakToken(): string | undefined {
  const keycloak = getKeycloakInstance();
  return keycloak.token;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getKeycloakTokenParsed(): Record<string, any> | undefined {
  const keycloak = getKeycloakInstance();
  return keycloak.tokenParsed;
}



