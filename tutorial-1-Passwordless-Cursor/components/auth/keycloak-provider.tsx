'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initKeycloak, loginWithKeycloak, logoutFromKeycloak } from '@/lib/auth/keycloak-client';

interface KeycloakContextType {
  authenticated: boolean;
  loading: boolean;
  userInfo: {
    email?: string;
    name?: string;
    sub?: string;
  } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  token?: string;
}

const KeycloakContext = createContext<KeycloakContextType>({
  authenticated: false,
  loading: true,
  userInfo: null,
  login: async () => {},
  logout: async () => {},
});

export function useKeycloakContext() {
  return useContext(KeycloakContext);
}

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<KeycloakContextType['userInfo']>(null);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    async function initialize() {
      try {
        console.log('Initializing Keycloak...');
        const { authenticated: isAuth, keycloak } = await initKeycloak({
          onLoad: 'check-sso',
        });

        console.log('Keycloak init result:', isAuth);
        setAuthenticated(isAuth);

        if (isAuth && keycloak.tokenParsed) {
          console.log('User authenticated:', keycloak.tokenParsed);
          setUserInfo({
            email: keycloak.tokenParsed.email,
            name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username,
            sub: keycloak.tokenParsed.sub,
          });
          setToken(keycloak.token);

          // Store session server-side
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: keycloak.tokenParsed.sub,
              email: keycloak.tokenParsed.email,
              name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username,
              accessToken: keycloak.token,
              idToken: keycloak.idToken,
              expiresAt: keycloak.tokenParsed.exp ? keycloak.tokenParsed.exp * 1000 : Date.now() + 300000,
            }),
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Keycloak initialization error:', error);
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const login = async () => {
    await loginWithKeycloak();
  };

  const logout = async () => {
    // Clear server-side session first
    await fetch('/api/auth/logout', { method: 'POST' });
    // Then logout from Keycloak
    await logoutFromKeycloak();
  };

  return (
    <KeycloakContext.Provider
      value={{
        authenticated,
        loading,
        userInfo,
        login,
        logout,
        token,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
}



