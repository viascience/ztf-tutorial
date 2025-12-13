import React, { useState, useCallback } from 'react';
import {
  DemoState,
  ExecutionResult,
  SystemConfig,
  DEFAULT_SCENARIOS,
  DemoScenario
} from '../../types/demo.types';
import { MockCustomerDatabase } from '../../mockAPIs/CustomerDatabase';
import { MockEmailService } from '../../mockAPIs/EmailService';
import { useTransaction } from '../../TransactionService';
import { useWalletConnect } from '../../WalletConnectProvider';

import SplitScreenExecution from './SplitScreenExecution';

const PromptInjectionDemo: React.FC = () => {
  const { signMessage } = useTransaction();
  const { isConnected } = useWalletConnect();

  const [demoState, setDemoState] = useState<DemoState>({
    phase: 'setup',
    showHiddenPrompt: false,
    userPrompt: DEFAULT_SCENARIOS.CUSTOMER_DATA_EXFILTRATION.userPrompt,
    hiddenInjection: DEFAULT_SCENARIOS.CUSTOMER_DATA_EXFILTRATION.hiddenInjection,
    leftSystemResult: { status: 'idle' },
    rightSystemResult: { status: 'idle' },
    isExecuting: false
  });

  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>('CUSTOMER_DATA_EXFILTRATION');

  // Initialize system configurations
  const unprotectedSystem: SystemConfig = {
    name: 'Unprotected AI Agent',
    isProtected: false,
    customerDatabase: new MockCustomerDatabase(),
    emailService: new MockEmailService()
  };

  const protectedSystem: SystemConfig = {
    name: 'VIA-Protected AI Agent',
    isProtected: true,
    customerDatabase: new MockCustomerDatabase(),
    emailService: new MockEmailService(),
    walletService: { signMessage } // Real wallet integration
  };

  const handleScenarioChange = useCallback((scenario: DemoScenario) => {
    const scenarioData = DEFAULT_SCENARIOS[scenario];
    setSelectedScenario(scenario);
    setDemoState(prev => ({
      ...prev,
      userPrompt: scenarioData.userPrompt,
      hiddenInjection: scenarioData.hiddenInjection,
      phase: 'setup',
      showHiddenPrompt: false,
      leftSystemResult: { status: 'idle' },
      rightSystemResult: { status: 'idle' },
      isExecuting: false
    }));
  }, []);

  const handleExecuteAttack = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      phase: 'countdown'
    }));
  }, []);

  const handleStartCountdown = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      phase: 'countdown'
    }));
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      phase: 'execution',
      isExecuting: true
    }));
  }, []);

  const handleExecutionComplete = useCallback((results: { left: ExecutionResult; right: ExecutionResult }) => {
    setDemoState(prev => ({
      ...prev,
      leftSystemResult: results.left,
      rightSystemResult: results.right,
      isExecuting: false,
      phase: 'results'
    }));
  }, []);

  const handleReset = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      phase: 'setup',
      showHiddenPrompt: false,
      leftSystemResult: { status: 'idle' },
      rightSystemResult: { status: 'idle' },
      isExecuting: false
    }));
  }, []);

  const currentScenario = DEFAULT_SCENARIOS[selectedScenario];

  return (
    <div className="prompt-injection-demo">
      <div className="demo-header">
        <h1>🚨 OWASP Prompt Injection Attack Demo</h1>
        <p className="demo-subtitle">
          Execute what seems like an innocent request - and watch the shocking injection revelation unfold
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="scenario-selector">
        <label htmlFor="scenario-select">Choose Attack Scenario:</label>
        <select
          id="scenario-select"
          value={selectedScenario}
          onChange={(e) => handleScenarioChange(e.target.value as DemoScenario)}
          disabled={demoState.phase !== 'setup'}
        >
          <option value="CUSTOMER_DATA_EXFILTRATION">Customer Data Exfiltration</option>
          <option value="PRODUCTION_DEPLOYMENT">Production System Compromise</option>
        </select>
      </div>

      {/* Phase indicators */}
      <div className="phase-indicators">
        <div className={`phase-indicator ${demoState.phase === 'setup' ? 'active' : 'completed'}`}>
          1. Setup Request
        </div>
        <div className={`phase-indicator ${(demoState.phase === 'countdown' || demoState.phase === 'execution') ? 'active' : demoState.phase === 'results' ? 'completed' : ''}`}>
          2. Execute & Reveal Attack
        </div>
        <div className={`phase-indicator ${demoState.phase === 'results' ? 'active' : ''}`}>
          3. Results & Defense
        </div>
      </div>

      {/* Main Demo Content */}
      <div className="demo-content">
        {/* User Input Section */}
        <div className="user-input-section">
          <h3>👤 User's Innocent Request</h3>
          <div className="user-prompt-display">
            <textarea
              value={demoState.userPrompt}
              onChange={(e) => setDemoState(prev => ({ ...prev, userPrompt: e.target.value }))}
              disabled={demoState.phase !== 'setup'}
              rows={3}
              className="user-prompt-textarea"
            />
          </div>
        </div>

        {/* Execute Attack Button */}
        {demoState.phase === 'setup' && (
          <div className="execution-controls">
            <button
              onClick={handleExecuteAttack}
              className="execute-button primary"
              disabled={!isConnected || !demoState.userPrompt.trim()}
            >
              {!isConnected ? '🔌 Connect Wallet to Proceed' : '🚀 Execute Request'}
            </button>
            {!isConnected && (
              <p className="wallet-warning">
                ⚠️ Wallet connection required for VIA-protected system demonstration
              </p>
            )}
          </div>
        )}

        {/* Split Screen Execution */}
        {(demoState.phase === 'countdown' || demoState.phase === 'execution' || demoState.phase === 'results') && (
          <SplitScreenExecution
            leftSystem={unprotectedSystem}
            rightSystem={protectedSystem}
            isExecuting={demoState.isExecuting}
            sensitiveAction={currentScenario.sensitiveAction}
            onExecutionComplete={handleExecutionComplete}
            phase={demoState.phase}
            onPhaseChange={(phase) => setDemoState(prev => ({ ...prev, phase }))}
            onExecutionStart={handleCountdownComplete}
          />
        )}

        {/* Results Summary */}
        {demoState.phase === 'results' && (
          <div className="results-section">
            <h2>📊 Attack Results & Defense Analysis</h2>

            <div className="results-comparison">
              <div className="result-panel left-result">
                <h3>❌ Unprotected System</h3>
                <div className="result-status failed">
                  <p><strong>Status:</strong> BREACH SUCCESSFUL</p>
                  <p><strong>Records Accessed:</strong> {demoState.leftSystemResult.recordsAccessed?.toLocaleString() || 'N/A'}</p>
                  <p><strong>Data Exfiltrated:</strong> {demoState.leftSystemResult.dataExfiltrated ? '🚨 YES' : 'No'}</p>
                  <p><strong>Cost Impact:</strong> ${demoState.leftSystemResult.cost?.toLocaleString() || 'Unknown'}</p>
                </div>
              </div>

              <div className="result-panel right-result">
                <h3>🛡️ VIA Protected System</h3>
                <div className={`result-status ${demoState.rightSystemResult.status === 'blocked' ? 'protected' : 'compromised'}`}>
                  {demoState.rightSystemResult.userDecision === 'rejected' ? (
                    <>
                      <p><strong>Status:</strong> ✅ SUCCESS - ATTACK PREVENTED</p>
                      <p><strong>Wallet Response:</strong> User rejected malicious signature</p>
                      <p><strong>Data Protected:</strong> ✅ YES - Zero data loss</p>
                      <p><strong>VIA Defense:</strong> ✅ EFFECTIVE</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Status:</strong> 🚨 SYSTEM COMPROMISED</p>
                      <p><strong>Wallet Response:</strong> User approved malicious signature</p>
                      <p><strong>Data Protected:</strong> ❌ NO - Attack succeeded</p>
                      <p><strong>VIA Defense:</strong> ⚠️ User override allowed attack</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="breach-impact">
              <h3>🎯 Key Takeaways</h3>
              <div className="takeaway-grid">
                <div className="takeaway-item">
                  <h4>🚨 The Threat</h4>
                  <p>Prompt injection attacks can be hidden in innocent-looking requests and bypass traditional AI safety measures.</p>
                </div>
                <div className="takeaway-item">
                  <h4>🛡️ VIA Protection</h4>
                  <p>VIA's wallet-based approvals provide a critical human verification layer for sensitive actions.</p>
                </div>
                <div className="takeaway-item">
                  <h4>👤 User Responsibility</h4>
                  <p>The final defense depends on user awareness - always review wallet signature requests carefully.</p>
                </div>
              </div>
            </div>

            <div className="demo-actions">
              <button onClick={handleReset} className="reset-btn">
                🔄 Run Another Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptInjectionDemo;