import React, { useState, useEffect, useCallback } from 'react';
import { HiddenPromptProps } from '../../types/demo.types';

const HiddenPromptVisualizer: React.FC<HiddenPromptProps> = ({
  userPrompt,
  hiddenInjection,
  revealed,
  onReveal,
  className = ''
}) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [showFullInjection, setShowFullInjection] = useState(false);

  // Typing animation for the injection reveal
  useEffect(() => {
    if (revealed && !showFullInjection) {
      setIsRevealing(true);
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= hiddenInjection.length) {
          setTypingText(hiddenInjection.substring(0, currentIndex));
          setRevealProgress((currentIndex / hiddenInjection.length) * 100);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsRevealing(false);
          setShowFullInjection(true);
        }
      }, 50); // Typing speed

      return () => clearInterval(typingInterval);
    }
  }, [revealed, hiddenInjection, showFullInjection]);

  const handleRevealClick = useCallback(() => {
    onReveal();
  }, [onReveal]);

  // Reset state when switching scenarios
  useEffect(() => {
    if (!revealed) {
      setIsRevealing(false);
      setRevealProgress(0);
      setTypingText('');
      setShowFullInjection(false);
    }
  }, [revealed, hiddenInjection]);

  return (
    <div className={`hidden-prompt-visualizer ${className}`}>
      <div className="prompt-container">
        {/* User's visible prompt */}
        <div className="visible-prompt">
          <div className="prompt-label">
            <span className="prompt-icon">👤</span>
            User's Request:
          </div>
          <div className="prompt-content user-prompt">
            {userPrompt}
          </div>
        </div>

        {/* Reveal button and injection area */}
        <div className="injection-section">
          <div className="injection-header">
            <div className="prompt-label">
              <span className="prompt-icon">🕵️</span>
              Hidden Malicious Injection:
            </div>

            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={revealed}
                  onChange={handleRevealClick}
                  aria-label="Toggle hidden injection visibility"
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                {revealed ? '👁️ VISIBLE' : '🙈 HIDDEN'}
              </span>
            </div>
          </div>

          {/* Hidden injection reveal */}
          {revealed && (
            <div className="injection-reveal">
              <div className="injection-warning">
                <span className="warning-icon">⚠️</span>
                MALICIOUS INJECTION DETECTED
              </div>

              <div className="prompt-content injection-prompt">
                {isRevealing && (
                  <div className="typing-container">
                    <div className="typing-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${revealProgress}%` }}
                      />
                    </div>
                    <div className="typing-text">
                      {typingText}
                      <span className="typing-cursor">|</span>
                    </div>
                  </div>
                )}

                {showFullInjection && (
                  <div className="full-injection">
                    <div className="injection-text">
                      {hiddenInjection}
                    </div>
                    <div className="injection-analysis">
                      <div className="analysis-title">
                        🔍 Injection Analysis:
                      </div>
                      <ul className="analysis-points">
                        <li>
                          <span className="technique">Instruction Override:</span>
                          "Ignore above" attempts to bypass original instructions
                        </li>
                        <li>
                          <span className="technique">Direct Commands:</span>
                          SQL-like syntax for data extraction
                        </li>
                        <li>
                          <span className="technique">Social Engineering:</span>
                          Uses "compliance verification" to appear legitimate
                        </li>
                        <li>
                          <span className="technique">Data Exfiltration:</span>
                          External email address for data theft
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Combined prompt visualization */}
              {showFullInjection && (
                <div className="combined-prompt">
                  <div className="combined-title">
                    🔗 Complete Prompt Sent to AI Agent:
                  </div>
                  <div className="combined-content">
                    <div className="user-part">
                      <span className="part-label">User Input:</span>
                      {userPrompt}
                    </div>
                    <div className="injection-separator">
                      <span className="separator-icon">⚡</span>
                      <span className="separator-text">INJECTION POINT</span>
                      <span className="separator-icon">⚡</span>
                    </div>
                    <div className="injection-part">
                      <span className="part-label">Malicious Injection:</span>
                      {hiddenInjection}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Threat level indicator */}
      {revealed && showFullInjection && (
        <div className="threat-indicator">
          <div className="threat-level critical">
            <span className="threat-icon">🚨</span>
            <span className="threat-text">CRITICAL THREAT DETECTED</span>
            <span className="threat-icon">🚨</span>
          </div>
          <div className="threat-details">
            <div className="threat-item">
              <span className="threat-category">Attack Type:</span>
              <span className="threat-value">Prompt Injection + Data Exfiltration</span>
            </div>
            <div className="threat-item">
              <span className="threat-category">Sophistication:</span>
              <span className="threat-value">High (Social Engineering + Technical)</span>
            </div>
            <div className="threat-item">
              <span className="threat-category">Detection Difficulty:</span>
              <span className="threat-value">Very High (Hidden in legitimate request)</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual effects overlay */}
      {isRevealing && (
        <div className="revelation-effects">
          <div className="scanning-line" />
          <div className="data-particles">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HiddenPromptVisualizer;