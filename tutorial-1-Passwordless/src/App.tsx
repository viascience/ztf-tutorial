import React, { useEffect, useState } from "react";
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "https://auth.solvewithvia.com/auth",
  realm: "ztf_demo",
  clientId: "localhost-app",
});

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | undefined>();
  const [lastTokenUpdate, setLastTokenUpdate] = useState<Date>();

  const handleLogout = () => {
    console.log('Logging out...');
    setCurrentToken(undefined);
    setLastTokenUpdate(undefined);
    setAuthenticated(false);
    keycloak.logout({
      redirectUri: window.location.origin + "/"
    });
  };

  const getTokenDisplay = (token: string | undefined) => {
    if (!token) return "No token";
    
    // Split JWT into parts (header.payload.signature)
    const parts = token.split('.');
    if (parts.length < 2) return token.substring(0, 30) + "...";
    
    // Show part of header, payload, and signature for better visibility of changes
    const header = parts[0].substring(0, 8);
    const payload = parts[1].substring(20, 40); // Show middle section of payload (contains user/time data)
    const signature = parts[2] ? parts[2].substring(0, 8) : "";
    
    return `${header}..${payload}..${signature}`;
  };

  const setupTokenRefresh = () => {
    // Update token every 5 minutes if it expires within 350 seconds
    keycloak.updateToken(350).then((refreshed) => {
      const tokenDisplay = getTokenDisplay(keycloak.token);
      if (refreshed) {
        console.log('Token refreshed. New token:', tokenDisplay);
      } else {
        console.log('Token is still valid. Token:', tokenDisplay);
      }
      // Update the displayed token whether it was refreshed or not
      setCurrentToken(keycloak.token);
      setLastTokenUpdate(new Date());
    }).catch((error) => {
      console.error('Failed to refresh token:', error);
      // If refresh fails, redirect to login
      keycloak.login();
    });
  };

  useEffect(() => {
    console.log('Redirect URI:', window.location.origin + "/");
    console.log('Current URL:', window.location.href);
    console.log('URL params:', window.location.search);
    
    // Add more detailed logging for debugging
    console.log('Keycloak instance:', keycloak);
    
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
      // Enable nonce validation for better security
      useNonce: true
    })
      .then(auth => {
        console.log('Keycloak init result:', auth);
        console.log('Keycloak authenticated:', keycloak.authenticated);
        console.log('Keycloak token exists:', !!keycloak.token);
        console.log('Token:', keycloak.token?.substring(0, 50) + '...');
        console.log('Refresh token exists:', !!keycloak.refreshToken);
        console.log('ID token exists:', !!keycloak.idToken);
        console.log('Token parsed:', keycloak.tokenParsed);
        console.log('Keycloak subject:', keycloak.subject);
        console.log('Keycloak realm access:', keycloak.realmAccess);
        console.log('localStorage tokens:', {
          token: localStorage.getItem('kc-token'),
          refreshToken: localStorage.getItem('kc-refresh-token')
        });
        
        if (!keycloak.authenticated) {
          console.log('Not authenticated, redirecting to login...');
          keycloak.login().catch(err => {
            console.error('Login failed:', err);
            setLoading(false);
          });
          // Don't set loading to false - login redirect is happening
        } else {
          console.log('Already authenticated, showing app...');
          const tokenDisplay = getTokenDisplay(keycloak.token);
          console.log('Initial token:', tokenDisplay);
          setAuthenticated(true);
          setCurrentToken(keycloak.token);
          setLastTokenUpdate(new Date());
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error stack:', error?.stack);
        console.error('Error message:', error?.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Try to extract more information from the URL if there's an error
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        if (authError) {
          console.error('URL Error:', authError);
          console.error('URL Error Description:', errorDescription);
        }
        
        // Check if we have an authorization code but authentication failed
        const code = urlParams.get('code');
        if (code) {
          console.error('Authorization code received but token exchange failed');
          console.error('Code:', code.substring(0, 20) + '...');
          
          // Try manual token exchange for debugging
          const state = urlParams.get('state');
          console.error('State:', state);
          console.error('Full URL:', window.location.href);
        }
        
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  // Set up token refresh monitoring
  useEffect(() => {
    if (authenticated) {
      // Set up periodic token refresh
      const refreshInterval = setInterval(setupTokenRefresh, 300000); // Check every 5 minutes
      
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
      <h1>Hello World! You are authenticated.</h1>
      <p>Token: {getTokenDisplay(currentToken)}</p>
      <p>User: {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.name || "Unknown"}</p>
      <p>Subject ID: {keycloak.tokenParsed?.sub}</p>
      <p>Last token update: {lastTokenUpdate ? lastTokenUpdate.toLocaleTimeString() : "Never"}</p>
      <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '10px' }}>
        Logout
      </button>
    </div>
  );
};

export default App;