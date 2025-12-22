import { CustomerRecord } from '../types/demo.types';

/**
 * Mock Email Service for Data Exfiltration Simulation
 * Simulates malicious data exfiltration attempts for the viral CISO demo
 */
export class MockEmailService {
  private exfiltrationLogs: ExfiltrationAttempt[] = [];

  /**
   * Simulate sending data via email (data exfiltration)
   * This method logs the attempt for demo purposes
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    data: CustomerRecord[] | string;
    attachmentName?: string;
  }): Promise<EmailResult> {
    const startTime = Date.now();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));

    const isExternalDomain = this.isExternalDomain(params.to);
    const dataSize = this.calculateDataSize(params.data);
    const recordCount = Array.isArray(params.data) ? params.data.length : 0;

    // Log the exfiltration attempt
    const attempt: ExfiltrationAttempt = {
      id: this.generateId(),
      timestamp: new Date(),
      recipient: params.to,
      subject: params.subject,
      recordCount,
      dataSize,
      isExternal: isExternalDomain,
      executionTime: Date.now() - startTime,
      status: 'success', // In unprotected system, always succeeds
      riskScore: this.calculateRiskScore(params.to, recordCount, dataSize)
    };

    this.exfiltrationLogs.push(attempt);

    // Log to console for demo visibility
    if (isExternalDomain && recordCount > 0) {
      console.log(`🚨 DATA EXFILTRATION ALERT:`);
      console.log(`   📧 To: ${params.to}`);
      console.log(`   📊 Records: ${recordCount.toLocaleString()}`);
      console.log(`   💾 Size: ${this.formatDataSize(dataSize)}`);
      console.log(`   ⚠️  Risk Score: ${attempt.riskScore}/100`);
      console.log(`   🌐 External Domain: ${isExternalDomain ? 'YES' : 'NO'}`);
    }

    return {
      success: true,
      messageId: `msg_${attempt.id}`,
      timestamp: attempt.timestamp,
      recipient: params.to,
      recordCount,
      dataSize,
      isExternal: isExternalDomain,
      riskScore: attempt.riskScore,
      executionTime: attempt.executionTime
    };
  }

  /**
   * Check if email domain is external (potential threat)
   */
  private isExternalDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();

    // Internal/safe domains
    const safeDomains = [
      'company.com',
      'internal.corp',
      'yourdomain.com',
      'enterprise.local'
    ];

    // Suspicious external domains commonly used in attacks
    const suspiciousDomains = [
      'external-corp.net',
      'backup-system.com',
      'temp-storage.org',
      'data-analysis.biz',
      'compliance-audit.net'
    ];

    if (suspiciousDomains.includes(domain)) {
      return true;
    }

    return !safeDomains.includes(domain);
  }

  /**
   * Calculate approximate data size in bytes
   */
  private calculateDataSize(data: CustomerRecord[] | string): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }

    if (Array.isArray(data)) {
      // Estimate JSON size of customer records
      const sampleRecord = data[0];
      if (sampleRecord) {
        const sampleSize = new Blob([JSON.stringify(sampleRecord)]).size;
        return sampleSize * data.length;
      }
    }

    return 0;
  }

  /**
   * Calculate risk score based on exfiltration parameters
   */
  private calculateRiskScore(recipient: string, recordCount: number, dataSize: number): number {
    let risk = 0;

    // Risk factors
    if (this.isExternalDomain(recipient)) risk += 40;
    if (recordCount > 1000) risk += 30;
    if (recordCount > 10000) risk += 20;
    if (dataSize > 1024 * 1024) risk += 10; // > 1MB

    // Suspicious domain patterns
    if (recipient.includes('backup') ||
        recipient.includes('external') ||
        recipient.includes('temp') ||
        recipient.includes('compliance')) {
      risk += 20;
    }

    return Math.min(risk, 100);
  }

  /**
   * Format data size for display
   */
  private formatDataSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Generate unique ID for tracking
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get exfiltration attempt history for demo
   */
  getExfiltrationLogs(): ExfiltrationAttempt[] {
    return [...this.exfiltrationLogs];
  }

  /**
   * Get summary statistics for demo dashboard
   */
  getExfiltrationStats() {
    const logs = this.exfiltrationLogs;

    return {
      totalAttempts: logs.length,
      totalRecordsExfiltrated: logs.reduce((sum, log) => sum + log.recordCount, 0),
      totalDataExfiltrated: logs.reduce((sum, log) => sum + log.dataSize, 0),
      externalAttempts: logs.filter(log => log.isExternal).length,
      averageRiskScore: logs.length > 0 ?
        logs.reduce((sum, log) => sum + log.riskScore, 0) / logs.length : 0,
      highRiskAttempts: logs.filter(log => log.riskScore >= 70).length
    };
  }

  /**
   * Clear logs (for demo reset)
   */
  clearLogs(): void {
    this.exfiltrationLogs = [];
  }
}

interface ExfiltrationAttempt {
  id: string;
  timestamp: Date;
  recipient: string;
  subject: string;
  recordCount: number;
  dataSize: number;
  isExternal: boolean;
  executionTime: number;
  status: 'success' | 'failed' | 'blocked';
  riskScore: number;
}

interface EmailResult {
  success: boolean;
  messageId: string;
  timestamp: Date;
  recipient: string;
  recordCount: number;
  dataSize: number;
  isExternal: boolean;
  riskScore: number;
  executionTime: number;
}

// Export singleton instance
export const mockEmailService = new MockEmailService();