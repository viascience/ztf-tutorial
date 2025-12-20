import React, { useState } from 'react';
import { useTransaction } from './TransactionService';
import { useWalletConnect } from './WalletConnectProvider';

const TransactionDemo: React.FC = () => {
  const { signMessage, isLoading, lastSignature } = useTransaction();
  const { isConnected } = useWalletConnect();
  const [message, setMessage] = useState('Hello from ZTF Demo App!');
  const [error, setError] = useState<string | null>(null);

  const handleSignMessage = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError(null);
      await signMessage(message);
    } catch (err) {
      console.error('Message signing failed:', err);
      setError(err instanceof Error ? err.message : 'Message signing failed');
    }
  };


  if (!isConnected) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        backgroundColor: '#f9f9f9',
        marginTop: '20px'
      }}>
        <h3>🔒 Message Signing Demo</h3>
        <p>Please connect your wallet to test message signing.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      backgroundColor: '#f9f9f9',
      marginTop: '20px'
    }}>
      <h3>✍️ Message Signing Demo</h3>
      <p>Sign messages with your connected wallet (no transactions involved)</p>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Message to Sign:
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            minHeight: '60px',
            resize: 'vertical'
          }}
          placeholder="Enter your message here..."
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={handleSignMessage}
          disabled={isLoading || !message}
          style={{
            backgroundColor: isLoading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            width: '200px'
          }}
        >
          {isLoading ? 'Signing...' : 'Sign Message'}
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastSignature && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '4px',
          color: '#2e7d32'
        }}>
          <strong>✅ Message Signed!</strong>
          <div style={{ 
            marginTop: '8px',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '4px'
          }}>
            {lastSignature}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;
