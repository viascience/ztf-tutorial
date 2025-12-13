import React, { useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { WalletConnectProvider, useWalletConnect } from "./WalletConnectProvider";
import { ConfigProvider, useConfig } from "./ConfigService";
import { TransactionProvider } from "./TransactionService";
import WalletConnectionStatus from "./WalletConnectionStatus";
import PromptInjectionDemo from "./components/demo/PromptInjectionDemo";

// Authentication timing constants
const TOKEN_MIN_VALIDITY_SECONDS = 350; // Minimum validity time before refreshing token
const TOKEN_REFRESH_CHECK_INTERVAL_MS = 300000; // Check token refresh every 5 minutes
const KEYCLOAK_MESSAGE_TIMEOUT_MS = 10000; // Timeout for Keycloak messages
const KEYCLOAK_LOGIN_IFRAME_CHECK_INTERVAL = 0; // Disabled (0 means no iframe check)

const keycloak = new Keycloak({
  url: "https://auth.solvewithvia.com/auth",
  realm: "ztf_demo",
  clientId: "localhost-app",
});

// Main app content component that uses the hooks
const AppContent: React.FC = () => {
  const { isInitialized, walletConnectInfo, loadAppConfig } = useConfig();
  const { initializeWithSessionInfo } = useWalletConnect();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTokenUpdate, setLastTokenUpdate] = useState<Date>();
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Initialize WalletConnect session when config is loaded (only once)
  useEffect(() => {
    if (isInitialized && walletConnectInfo && authenticated && !sessionInitialized) {
      initializeWithSessionInfo(walletConnectInfo);
      setSessionInitialized(true);
    }
  }, [isInitialized, walletConnectInfo, authenticated, sessionInitialized, initializeWithSessionInfo]);

  const handleLogout = () => {
    setLastTokenUpdate(undefined);
    setAuthenticated(false);
    keycloak.logout({
      redirectUri: window.location.origin + "/"
    });
  };


  const setupTokenRefresh = () => {
    keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS).then((refreshed) => {
      if (refreshed) {
        setLastTokenUpdate(new Date());
      }
    }).catch((error) => {
      console.error('Failed to refresh token:', error);
      keycloak.login();
    });
  };

  useEffect(() => {
    keycloak.init({ 
      onLoad: "login-required",
      redirectUri: window.location.origin + "/",
      checkLoginIframe: false,
      responseMode: "query",
      pkceMethod: "S256",
      scope: "openid profile email",
      checkLoginIframeInterval: KEYCLOAK_LOGIN_IFRAME_CHECK_INTERVAL,
      messageReceiveTimeout: KEYCLOAK_MESSAGE_TIMEOUT_MS,
      flow: "standard",
      useNonce: true
    })
      .then(auth => {        
        if (!keycloak.authenticated) {
          keycloak.login().catch(err => {
            console.error('Login failed:', err);
            setLoading(false);
          });
        } else {
          setAuthenticated(true);
          setLastTokenUpdate(new Date());
          
          // Load app config after authentication
          loadAppConfig(keycloak).then(() => {
            setLoading(false);
          }).catch((error) => {
            console.error('Failed to load app config:', error);
            setLoading(false);
          });
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  // Set up token refresh monitoring
  useEffect(() => {
    if (authenticated) {
      // Set up periodic token refresh
      const refreshInterval = setInterval(setupTokenRefresh, TOKEN_REFRESH_CHECK_INTERVAL_MS);
      
      // Initial token refresh setup
      setupTokenRefresh();
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [authenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>ZTF Tutorial 2: OWASP Prompt Injection</h1>
        <WalletConnectionStatus />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>User: {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.name || "Unknown"}</p>
        <p>Last login: {lastTokenUpdate ? lastTokenUpdate.toLocaleString() : "Never"}</p>
      </div>

      {/* Prompt Injection Demo */}
      <PromptInjectionDemo />

      <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
};

// Main App component with providers
const App: React.FC = () => {
  const handleAppLogout = () => {
    keycloak.logout({
      redirectUri: window.location.origin + "/"
    });
  };

  return (
    <ConfigProvider>
      <WalletConnectProvider onSessionDisconnected={handleAppLogout}>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </WalletConnectProvider>
    </ConfigProvider>
  );
};

export default App;