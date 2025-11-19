import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ConfigState {
  isInitialized: boolean;
  userInfo: any | null;
  walletConnectInfo: any | null;
  publicKey: string | null;
  userType: string | null;
  error: string | null;
}

interface ConfigContextType extends ConfigState {
  loadAppConfig: (keycloak: any) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [walletConnectInfo, setWalletConnectInfo] = useState<any | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAppConfig = async (keycloak: any) => {
    try {
      if (!keycloak?.token) {
        throw new Error('No Keycloak token available');
      }

      // Construct userinfo URL - replace with actual realm name
      const realm = 'ztf_demo'; // You can make this configurable
      const userInfoUrl = `https://auth.solvewithvia.com/auth/realms/${realm}/protocol/openid-connect/userinfo`;
      
      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      const userInfoData = await response.json();
      setUserInfo(userInfoData);

      // Extract and decode walletConnectSessionInfo
      let decodedWalletConnectInfo = null;
      if (userInfoData.walletConnectSessionInfo) {
        try {
          const decodedString = atob(userInfoData.walletConnectSessionInfo);
          decodedWalletConnectInfo = JSON.parse(decodedString);
        } catch (decodeError) {
          console.error('Failed to decode walletConnectSessionInfo:', decodeError);
        }
      }

      // Extract user data
      const userPublicKey = userInfoData.public_key || null;
      const dataItemId = userInfoData.data_item_id || null;
      
      // Store non-sensitive data in localStorage for persistence across sessions
      if (userPublicKey) localStorage.setItem('publicKey', userPublicKey);
      if (userInfoData.organization_name) localStorage.setItem('orgName', userInfoData.organization_name);

      // Store sensitive data in sessionStorage (clears when tab closes)
      if (userInfoData.user_type) sessionStorage.setItem('userType', userInfoData.user_type);
      if (dataItemId) sessionStorage.setItem('dataItemId', dataItemId);

      // Set state
      setWalletConnectInfo(decodedWalletConnectInfo);
      setPublicKey(userPublicKey);
      setUserType(userInfoData.user_type);

    } catch (err) {
      console.error('Error loading app config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading config');
    } finally {
      setIsInitialized(true);
    }
  };

  const value: ConfigContextType = {
    isInitialized,
    userInfo,
    walletConnectInfo,
    publicKey,
    userType,
    error,
    loadAppConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};