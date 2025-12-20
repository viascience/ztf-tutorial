import React, { createContext, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWalletConnect } from './WalletConnectProvider';

interface TransactionState {
  signMessage: (message: string) => Promise<string | null>;
  signRequestBody: (requestBody: any) => Promise<string | null>;
  isLoading: boolean;
  lastSignature: string | null;
}

const TransactionContext = createContext<TransactionState | null>(null);

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const { client, session } = useWalletConnect();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSignature, setLastSignature] = React.useState<string | null>(null);

  const signMessage = async (message: string): Promise<string | null> => {
    if (!client || !session) {
      console.error('WalletConnect not connected');
      return null;
    }

    let methodToUse = 'personal_sign'; // Declare outside try block for error handling

    try {
      setIsLoading(true);
      setLastSignature(null); // Clear previous signature before new request

      // Validate that we have an active session with encryption keys
      const activeSessions = client.session.getAll();
      const hasActiveSession = activeSessions.some(s => s.topic === session.topic);

      if (!hasActiveSession) {
        throw new Error('Session not found in active sessions. This may indicate the session has expired or was not properly restored. Please connect your wallet again.');
      }


      // Get the connected account - check all available namespaces
      let accounts: string[] = [];
      let namespaceConfig: any = null;

      // Try viasecurechain first, then fallback to any available namespace
      if (session.namespaces.viasecurechain?.accounts?.length > 0) {
        accounts = session.namespaces.viasecurechain.accounts;
        namespaceConfig = session.namespaces.viasecurechain;
      } else {
        // Fallback: find any namespace with accounts
        for (const [namespace, config] of Object.entries(session.namespaces || {})) {
          if (config.accounts && config.accounts.length > 0) {
            accounts = config.accounts;
            namespaceConfig = config;
            break;
          }
        }
      }

      if (accounts.length === 0) {
        throw new Error('No accounts found in any namespace');
      }

      const fullAccount = accounts[0]; // e.g., "besu:1337:0xbA447B1..."
      const fromAccount = fullAccount.split(':')[2]; // Extract address
      const chainId = fullAccount.split(':').slice(0, 2).join(':'); // e.g., "besu:1337"

      // Only use personal_sign method
      const availableMethods = namespaceConfig.methods || [];

      if (!availableMethods.includes('personal_sign')) {
        throw new Error(`❌ personal_sign method not available. Available methods: [${availableMethods.join(', ')}]. Only personal_sign is supported.`);
      }


      // Send message to wallet for signing using personal_sign
      const params = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
        fromAccount
      ];

      const signature = await client.request({
        topic: session.topic,
        chainId: chainId,
        request: {
          method: methodToUse,
          params: params
        }
      });

      setLastSignature(signature as string);

      return signature as string;

    } catch (error) {
      console.error('Message signing failed:', error);

      // Provide more specific error information for debugging
      if (error instanceof Error && error.message.includes('asset')) {
        throw new Error(`Asset-related error in message signing with method ${methodToUse}: ${error.message}`);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create deterministic JSON string for consistent hashing (matches backend implementation)
  const createDeterministicJSON = (obj: any): string => {
    // Remove signature field from the object for hashing
    const { signature, ...objWithoutSignature } = obj;

    // Sort keys recursively to ensure consistent ordering
    function sortKeys(item: any): any {
      if (Array.isArray(item)) {
        return item.map(sortKeys);
      } else if (item !== null && typeof item === 'object') {
        return Object.keys(item)
          .sort()
          .reduce((sorted: any, key: string) => {
            sorted[key] = sortKeys(item[key]);
            return sorted;
          }, {});
      }
      return item;
    }

    const sortedObj = sortKeys(objWithoutSignature);
    return JSON.stringify(sortedObj);
  };

  // Create SHA256 hash using browser's SubtleCrypto API
  const createSHA256Hash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Sign request body for sensitive endpoint validation
  const signRequestBody = async (requestBody: any): Promise<string | null> => {
    try {
      console.log('[FRONTEND] Creating request body signature...');

      // Create deterministic JSON representation
      const deterministicJSON = createDeterministicJSON(requestBody);
      console.log(`[FRONTEND] Deterministic JSON: ${deterministicJSON.substring(0, 100)}...`);

      // Create SHA256 hash
      const hash = await createSHA256Hash(deterministicJSON);
      console.log(`[FRONTEND] Generated hash: ${hash}`);

      // Create the message that matches backend expectation
      const messageToSign = `Request hash: ${hash}`;
      console.log(`[FRONTEND] Message to sign: ${messageToSign}`);

      // Sign the hash message using existing wallet signing infrastructure
      const signature = await signMessage(messageToSign);

      if (signature) {
        console.log(`[FRONTEND] ✅ Request body signed successfully`);
        console.log(`[FRONTEND] Signature: ${signature.substring(0, 50)}...`);
      }

      return signature;

    } catch (error) {
      console.error('[FRONTEND] ❌ Request body signing failed:', error);
      throw new Error(`Failed to sign request body: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const value: TransactionState = {
    signMessage,
    signRequestBody,
    isLoading,
    lastSignature
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = (): TransactionState => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within TransactionProvider');
  }
  return context;
};