import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import SignClient from '@walletconnect/sign-client';
import { SessionTypes } from '@walletconnect/types';
import { IKeyValueStorage } from '@walletconnect/keyvaluestorage';

// Custom storage service to bridge Keycloak restored data with WalletConnect (following Angular pattern)
class WalletConnectStorageService implements IKeyValueStorage {
  keyPrefix: string = 'wc@2:'; // Same pattern as Angular example
  private restoredData: Record<string, string> = {};
  private useLocalStorage: boolean = true;

  constructor() {
  }

  // Sanitize WalletConnect data to ensure arrays are not null
  private sanitizeWalletConnectData(data: any, key: string): any {
    if (data === null || data === undefined) {
      return Array.isArray(data) ? [] : {};
    }

    if (Array.isArray(data)) {
      // If it's already an array, sanitize each element
      return data.map((item, index) => this.sanitizeWalletConnectData(item, `${key}[${index}]`));
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };

      // Common WC properties that should be arrays, not null
      const arrayProperties = [
        'cached', 'messages', 'history', 'subscriptions', 'events',
        'topics', 'pairings', 'sessions', 'proposals', 'expiries',
        'methods', 'events', 'accounts', 'chains'
      ];

      Object.keys(sanitized).forEach(prop => {
        if (sanitized[prop] === null && arrayProperties.includes(prop)) {
          sanitized[prop] = [];
        } else if (typeof sanitized[prop] === 'object') {
          sanitized[prop] = this.sanitizeWalletConnectData(sanitized[prop], `${key}.${prop}`);
        }
      });

      return sanitized;
    }

    return data;
  }

  // Store WalletConnect info (similar to Angular's storeWcInfo method)
  async storeWcInfo(sessionInfo: any): Promise<void> {

    const wcKeys = [
      'wc@2:client:0.3//session',
      'wc@2:core:0.3//subscription',
      'wc@2:core:0.3//messages',
      'wc@2:client:0.3//proposal',
      'wc@2:core:0.3//keychain',
      'wc@2:core:0.3//pairing',
      'wc@2:core:0.3//history',
      'wc@2:core:0.3//expirer',
    ];

    wcKeys.forEach(key => {
      if (sessionInfo[key] !== undefined) {
        let dataToStore = sessionInfo[key];

        // Transform session keys from indices to actual topics
        if (key === 'wc@2:client:0.3//session' && typeof dataToStore === 'object') {
          const transformedSessions: any = {};

          Object.entries(dataToStore).forEach(([sessionKey, sessionData]: [string, any]) => {
            if (sessionData && sessionData.topic) {
              transformedSessions[sessionData.topic] = sessionData;
            } else {
              transformedSessions[sessionKey] = sessionData;
            }
          });

          dataToStore = transformedSessions;
        }

        // Store as JSON string
        const jsonData = typeof dataToStore === 'object'
          ? JSON.stringify(dataToStore)
          : dataToStore;

        this.restoredData[key] = jsonData;

        // CRITICAL FIX: Also store session data under the key WalletConnect restore() expects
        if (key === 'wc@2:client:0.3//session') {
          const restoreKey = 'wc@2:client:session';
          this.restoredData[restoreKey] = jsonData;
        }
      }
    });

  }

  // WalletConnect storage interface methods
  async getItem<T = any>(key: string): Promise<T | undefined> {
    // First check if we have restored data for this key
    if (this.restoredData[key] !== undefined) {

      const jsonValue = this.restoredData[key];

      // WalletConnect expects parsed objects/arrays for most keys, not JSON strings
      // Only return raw strings for simple string values
      const stringOnlyKeys: string[] = [
        // Add any keys that should remain as strings
      ];

      if (!stringOnlyKeys.includes(key)) {
        try {
          const parsedValue = JSON.parse(jsonValue);

          // Sanitize the parsed data to ensure arrays are not null
          const sanitizedValue = this.sanitizeWalletConnectData(parsedValue, key);

          return sanitizedValue;
        } catch (e) {
          return jsonValue as T;
        }
      }

      return jsonValue as T;
    }

    // Fall back to localStorage
    if (this.useLocalStorage) {
      const value = localStorage.getItem(key);
      if (value) {
        // Apply same parsing logic to localStorage values
        const stringOnlyKeys: string[] = [];
        if (!stringOnlyKeys.includes(key)) {
          try {
            const parsedValue = JSON.parse(value);
            const sanitizedValue = this.sanitizeWalletConnectData(parsedValue, key);
            return sanitizedValue;
          } catch (e) {
            return value as T;
          }
        }
      }
      return (value as T) || undefined;
    }

    return undefined;
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // Store in localStorage for persistence
    if (this.useLocalStorage) {
      localStorage.setItem(key, valueStr);
    }

    // Also update our in-memory cache
    this.restoredData[key] = valueStr;
  }

  async removeItem(key: string): Promise<void> {

    if (this.useLocalStorage) {
      localStorage.removeItem(key);
    }

    delete this.restoredData[key];
  }


  async getKeys(): Promise<string[]> {

    // Follow exact Angular pattern but adapt for our hybrid storage
    const keys: string[] = [];

    // First, get keys from restored data that match our prefix
    Object.keys(this.restoredData).forEach(key => {
      if (key?.startsWith(this.keyPrefix)) {
        keys.push(key);
      }
    });

    // Then, get keys from localStorage that match our prefix (Angular pattern)
    if (this.useLocalStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.keyPrefix)) {
          keys.push(key);
        }
      }
    }

    // Deduplicate (same as Angular would need if combining sources)
    const uniqueKeys = [...new Set(keys)];
    return uniqueKeys;
  }

  async getEntries<T = any>(): Promise<[string, T][]> {

    const keys = await this.getKeys();
    const entries: [string, T][] = [];

    for (const key of keys) {
      const value = await this.getItem(key);
      if (value) {
        entries.push([key, value]);
      }
    }

    return entries;
  }
}

interface WalletConnectState {
  client: InstanceType<typeof SignClient> | null;
  session: SessionTypes.Struct | null;
  isConnected: boolean;
  isLoading: boolean;
  uri: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  initializeWithSessionInfo: (sessionInfo: any) => Promise<void>;
  getOriginalSessionDetails: (session: SessionTypes.Struct) => {
    topic: string;
    expiry: number;
    namespaces: Record<string, {
      chainIds: string[];
      methods: string[];
      events: string[];
      accounts: string[]
    }>
  };
}

const WalletConnectContext = createContext<WalletConnectState | null>(null);

interface WalletConnectProviderProps {
  children: ReactNode;
  onSessionDisconnected?: () => void;
}

export const WalletConnectProvider: React.FC<WalletConnectProviderProps> = ({ children, onSessionDisconnected }) => {
  const [client, setClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create storage service instance
  const [storageService] = useState(() => new WalletConnectStorageService());

  const isConnected = !!session;

  const clearError = () => setError(null);

  // Helper function to extract original session details
  const getOriginalSessionDetails = (session: SessionTypes.Struct) => {
    const details = {
      topic: session.topic,
      expiry: session.expiry,
      namespaces: {} as Record<string, {
        chainIds: string[],
        methods: string[],
        events: string[],
        accounts: string[]
      }>
    };

    Object.entries(session.namespaces || {}).forEach(([namespace, config]) => {
      details.namespaces[namespace] = {
        chainIds: config.chains || [],
        methods: config.methods || [],
        events: config.events || [],
        accounts: config.accounts || []
      };
    });

    return details;
  };


  const initWalletConnect = async (storageService?: WalletConnectStorageService) => {
    try {

      // Initialize the main client with custom storage service
      const signClient = await SignClient.init({
        projectId: 'f54e2cf5d6e7a0f8ac954656ff5591b6',
        relayUrl: 'wss://relay.wallet.solvewithvia.com',
        storage: storageService, // 🔑 KEY CHANGE: Use custom storage service
        metadata: {
          name: 'ZTF Tutorial App',
          description: 'ZTF Tutorial Web3 Integration',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      });

      setClient(signClient);


      // Listen for session events
      signClient.on('session_update', (args) => {
        const updatedSession = signClient.session.get(args.topic);
        setSession(updatedSession);
      });

      signClient.on('session_delete', (args) => {
        console.log('WalletConnect session deleted, triggering logout...');
        setSession(null);
        if (onSessionDisconnected) {
          onSessionDisconnected();
        }
      });

      return signClient;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      setError('Failed to initialize WalletConnect');
      throw error;
    }
  };

  const connect = async () => {
    if (!client) {
      console.error('WalletConnect client not initialized, initializing now...');
      // Initialize client with storage service if not already done
      await initWalletConnect(storageService);
      return;
    }
    
    try {
      setIsLoading(true);
      setUri(null);
      clearError();

      const { uri: connectionUri, approval } = await client.connect({
        optionalNamespaces: {
          viasecurechain: {
            methods: ['personal_sign'],
            chains: ['viasecurechain:mainnet'],
            events: []
          }
        }
      });

      if (connectionUri) {
        setUri(connectionUri);
      }

      // Wait for approval with 5 minute timeout
      const newSession = await Promise.race([
        approval(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 minutes')), 300000)
        )
      ]) as SessionTypes.Struct;

      setSession(newSession);
      setUri(null);
      setError(null);


      // Store session info for recovery
      localStorage.setItem('walletconnect_session', JSON.stringify({
        topic: newSession.topic,
        expiry: newSession.expiry,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setError(`Connection failed: ${errorMessage}`);
      setUri(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!client || !session) return;

    try {
      await client.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: 'User disconnected' }
      });
      setSession(null);
      localStorage.removeItem('walletconnect_session');
    } catch (error) {
      console.error('Failed to disconnect WalletConnect:', error);
      // Still clear local session even if disconnect failed
      setSession(null);
      localStorage.removeItem('walletconnect_session');
    }
  };

  // Initialize WalletConnect core functionality and session management
  const initializeWalletConnectCore = async (signClient: SignClient) => {
    try {
      // Initialize session manager
      if (signClient.session) {
        signClient.session.getAll();
      }

      // Initialize core storage
      if (signClient.core && signClient.core.storage) {
        // Storage methods are called as needed by other components
      }

      // Initialize pairing manager
      if (signClient.pairing) {
        signClient.pairing.getAll();
      }

      // Access internal session store if available
      if ((signClient as any).session?.store) {
        const sessionStore = (signClient as any).session.store;

        if (sessionStore.getAll) {
          sessionStore.getAll();
        }
      }

      // Initialize session
      if ((signClient as any).session?.init) {
        await (signClient as any).session.init();
      }

      // Restore session if available
      if ((signClient as any).session?.restore) {
        await (signClient as any).session.restore();
      }

      // Manual session processing and restoration
      if ((signClient as any).session) {
        try {
          const session = (signClient as any).session;
          const sessionData = await session.core.storage.getItem(session.storagePrefix + 'session');

          if (sessionData && typeof sessionData === 'object') {
            for (const [topic, sessionInfo] of Object.entries(sessionData)) {
              // Validate session structure and expiry
              const isValidStructure = (sessionInfo as any)?.topic && (sessionInfo as any)?.expiry && (sessionInfo as any)?.acknowledged;
              const isNotExpired = (sessionInfo as any)?.expiry * 1000 > Date.now();

              if (isValidStructure && isNotExpired) {
                try {
                  await session.set(topic, sessionInfo);
                } catch (error) {
                  // Session validation failed, skip this session
                }
              }
            }
          }
        } catch (error) {
          // Manual session processing failed, continue with normal initialization
        }
      }

      // Manually trigger session restore if available
      if ((signClient as any).session?.restore && typeof (signClient as any).session.restore === 'function') {
        try {
          await (signClient as any).session.restore();
        } catch (error) {
          // Session restore failed, continue with normal initialization
        }
      }

    } catch (error) {
      // WalletConnect initialization failed, continue without debugging
    }
  };

  const initializeWithSessionInfo = async (sessionInfo: any) => {
    try {
      // Step 1: Store WC info BEFORE SignClient initialization (Angular pattern)
      if (sessionInfo) {
        await storageService.storeWcInfo(sessionInfo);
      } else {
      }

      // Step 2: Initialize SignClient with the storage service
      const signClient = await initWalletConnect(storageService);

      await initializeWalletConnectCore(signClient);

      // Step 3: Check state after initialization (Angular pattern)
      await checkWalletConnectState(signClient);

    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error);
      setError('Failed to initialize WalletConnect');
    }
  };

  // Check WalletConnect state after initialization (based on Angular checkState method)
  const checkWalletConnectState = async (signClient: SignClient) => {
    try {
      console.log('🔍 DEBUG: Checking session data in storage...');
      const sessionData = await storageService.getItem('wc@2:client:0.3//session');
      console.log('🔍 DEBUG: Raw session data from storage:', sessionData);

      if (sessionData && typeof sessionData === 'object') {
        console.log('🔍 DEBUG: Session topics in storage:', Object.keys(sessionData));
        Object.entries(sessionData).forEach(([topic, session]: [string, any]) => {
          console.log(`🔍 DEBUG: Session ${topic}:`, {
            topic: session?.topic,
            expiry: session?.expiry,
            acknowledged: session?.acknowledged,
            hasNamespaces: !!session?.namespaces,
            controller: session?.controller,
            selfPublicKey: session?.selfPublicKey,
            peerPublicKey: session?.peerPublicKey,
            requiredNamespaces: !!session?.requiredNamespaces,
            optionalNamespaces: !!session?.optionalNamespaces
          });

          // Check if session is expired
          const isExpired = session?.expiry * 1000 < Date.now();
          console.log(`🔍 DEBUG: Session ${topic} expired:`, isExpired);

          // Log full session structure
          console.log(`🔍 DEBUG: Full session ${topic}:`, session);
        });
      }

      // Get existing pairings
      const pairings = signClient.core.pairing.getPairings();
      console.log(`Found ${pairings.length} existing pairings`);

      if (pairings.length > 0) {
        console.log('🔍 DEBUG: Pairing topics:', pairings.map(p => p.topic));
      }

      // Get existing sessions
      const sessions = signClient.session.getAll();
      console.log(`Found ${sessions.length} existing sessions`);

      if (sessions.length === 0) {
        console.log('❌ No sessions found after initialization');
        return;
      }

      // Find the most recent valid session
      const validSessions = sessions
        .filter((session: any) => session.expiry * 1000 > Date.now())
        .sort((a: any, b: any) => b.expiry - a.expiry);

      if (validSessions.length === 0) {
        console.log('❌ All sessions are expired');
        return;
      }

      const activeSession = validSessions[0];
      console.log('🎯 Found active session:', activeSession.topic);

      // Ping the session to verify it's still active (Angular pattern)
      try {
        console.log('🏓 Pinging session to verify connectivity...');
        await signClient.ping({ topic: activeSession.topic });
        console.log('✅ Session ping successful');

        // Set the active session in our state
        setSession(activeSession);
        setError(null);

        const originalDetails = getOriginalSessionDetails(activeSession);
        console.log('=== RESTORED SESSION DETAILS ===');
        console.log('Session Topic:', originalDetails.topic);
        console.log('Session Expiry:', new Date(originalDetails.expiry * 1000).toISOString());

        Object.entries(originalDetails.namespaces).forEach(([namespace, config]) => {
          console.log(`\n📋 Namespace: ${namespace}`);
          console.log(`  🔗 Chain IDs: [${config.chainIds.join(', ') || 'none'}]`);
          console.log(`  🔧 Methods: [${config.methods.join(', ') || 'none'}]`);
          console.log(`  📡 Events: [${config.events.join(', ') || 'none'}]`);
          console.log(`  👤 Accounts: [${config.accounts.join(', ') || 'none'}]`);
        });

        console.log('=== END SESSION DETAILS ===');

        // Store metadata for persistence
        localStorage.setItem('walletconnect_session', JSON.stringify({
          topic: activeSession.topic,
          expiry: activeSession.expiry,
          timestamp: Date.now()
        }));

        console.log('✅ WalletConnect session successfully restored and verified!');

      } catch (pingError) {
        console.error('❌ Session ping failed, session may be inactive:', pingError);
        setError('Session verification failed');
      }

    } catch (error) {
      console.error('❌ Error checking WalletConnect state:', error);
      setError('Failed to check WalletConnect state');
    }
  };

  // Note: Client initialization is now handled by initializeWithSessionInfo
  // No automatic initialization in useEffect to prevent conflicts

  const value: WalletConnectState = {
    client,
    session,
    isConnected,
    isLoading,
    uri,
    error,
    connect,
    disconnect,
    clearError,
    initializeWithSessionInfo,
    getOriginalSessionDetails
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};

export const useWalletConnect = (): WalletConnectState => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider');
  }
  return context;
};