import React, { useState } from 'react';
import { useWalletConnect } from './WalletConnectProvider';

const WalletConnectionStatus: React.FC = () => {
  const { isConnected, isLoading, session, uri, error, connect, clearError } = useWalletConnect();
  const [showQR, setShowQR] = useState(false);

  const getWalletAddress = () => {
    if (!session?.namespaces?.eip155?.accounts) return null;
    const account = session.namespaces.eip155.accounts[0];
    return account?.split(':')[2]; // Extract address from "eip155:1:0x..."
  };

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    clearError(); // Clear any previous errors
    await connect();
    setShowQR(true);
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInWallet = (uri: string) => {
    // Common wallet deep links
    const wallets = [
      { name: 'MetaMask', url: `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}` },
      { name: 'Trust Wallet', url: `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}` },
      { name: 'Rainbow', url: `https://rnbwapp.com/wc?uri=${encodeURIComponent(uri)}` }
    ];
    
    return wallets;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Connection Status Indicator */}
        <div 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: isConnected ? '#10B981' : (error ? '#F59E0B' : '#EF4444'),
            position: 'relative'
          }}
          title={isConnected ? 'Wallet Connected' : (error ? 'Connection Error' : 'Wallet Disconnected')}
        >
          {isConnected && (
            <div 
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                opacity: 0.3,
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </div>

      {/* Wallet Info */}
      {isConnected && session ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 'bold' }}>
            🔗 {formatAddress(getWalletAddress())}
          </span>
          <button
            onClick={() => copyToClipboard(getWalletAddress() || '')}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Copy address"
          >
            📋
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            {isLoading ? '⏳ Connecting...' : '❌ Not Connected'}
          </span>
          {!isLoading && (
            <button
              onClick={handleConnect}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#92400E',
          maxWidth: '300px',
          wordWrap: 'break-word'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400E',
                cursor: 'pointer',
                fontSize: '14px',
                marginLeft: '8px'
              }}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* QR Code and Deep Links Modal */}
      {showQR && uri && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQR(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Connect Your Wallet</h3>
            
            {/* QR Code Display */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div 
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              >
                <p>Scan with your wallet app:</p>
                <div style={{ 
                  wordBreak: 'break-all', 
                  fontSize: '10px', 
                  fontFamily: 'monospace',
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '4px'
                }}>
                  {uri}
                </div>
              </div>
            </div>

            {/* Quick Connect Links */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Or connect directly:</h4>
              {openInWallet(uri).map((wallet) => (
                <div key={wallet.name} style={{ marginBottom: '8px' }}>
                  <a
                    href={wallet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      backgroundColor: '#f0f0f0',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      color: '#333'
                    }}
                  >
                    Connect with {wallet.name} →
                  </a>
                </div>
              ))}
            </div>

            {/* Copy URI */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(uri)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copy URI
              </button>
              <button
                onClick={() => setShowQR(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.1; }
          }
        `}
      </style>
    </div>
  );
};

export default WalletConnectionStatus;