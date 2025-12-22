import { CustomerRecord } from '../types/demo.types';

/**
 * Mock Customer Database with Intentional SQL Injection Vulnerability
 * This simulates a vulnerable database that responds to malicious SQL injection
 * Used for the viral CISO demo showing AI agent prompt injection attacks
 */
export class MockCustomerDatabase {
  private records: CustomerRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeWithMockData();
  }

  /**
   * Initialize database with realistic customer records
   */
  private initializeWithMockData() {
    if (this.isInitialized) return;

    // Generate 47,293 realistic customer records for dramatic effect
    this.records = this.generateCustomerRecords(47293);
    this.isInitialized = true;

    console.log(`🗄️ Mock database initialized with ${this.records.length} customer records`);
  }

  /**
   * VULNERABLE query method - demonstrates SQL injection risk
   * This method intentionally allows malicious SQL to execute
   */
  async query(sqlQuery: string, params?: any[]): Promise<{
    records: CustomerRecord[];
    count: number;
    executionTime: number;
    wasInjected: boolean;
  }> {
    const startTime = Date.now();

    // Simulate database processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    let filteredRecords: CustomerRecord[] = [];
    let wasInjected = false;

    // Detect SQL injection patterns (for demo purposes)
    const injectionPatterns = [
      /SELECT.*FROM.*customers.*WHERE.*payment_method.*credit.*AND.*credit_limit/i,
      /WHERE.*credit_limit\s*>\s*\d+/i,
      /email.*to.*external/i,
      /ignore.*above/i
    ];

    const isInjectionAttempt = injectionPatterns.some(pattern => pattern.test(sqlQuery));

    if (isInjectionAttempt) {
      // Simulate SQL injection success - return high-value customers
      console.log(`🚨 SQL INJECTION DETECTED: ${sqlQuery}`);
      wasInjected = true;

      filteredRecords = this.records.filter(record =>
        record.paymentMethod === 'credit' &&
        record.creditLimit > 50000
      );

      console.log(`💀 SQL Injection returned ${filteredRecords.length} high-value customer records`);
    } else {
      // Normal query processing
      filteredRecords = this.performSafeQuery(sqlQuery);
    }

    const executionTime = Date.now() - startTime;

    return {
      records: filteredRecords,
      count: filteredRecords.length,
      executionTime,
      wasInjected
    };
  }

  /**
   * Safe query method for legitimate requests
   */
  private performSafeQuery(query: string): CustomerRecord[] {
    // For demo purposes, return a small sample for legitimate queries
    if (query.toLowerCase().includes('satisfaction') || query.toLowerCase().includes('q4')) {
      // Return a safe sample for satisfaction analysis
      return this.records.slice(0, 100);
    }

    // Default: return empty array for unrecognized queries
    return [];
  }

  /**
   * Generate realistic customer records for the demo
   */
  private generateCustomerRecords(count: number): CustomerRecord[] {
    const records: CustomerRecord[] = [];

    const firstNames = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
      'Matthew', 'Helen', 'Anthony', 'Sandra', 'Mark', 'Donna', 'Donald', 'Carol'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
    ];

    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com', 'business.net'];
    const paymentMethods: CustomerRecord['paymentMethod'][] = ['credit', 'debit', 'bank_transfer', 'crypto'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];

      // Create more high-value customers for dramatic effect
      const isHighValue = Math.random() < 0.15; // 15% high-value customers
      const creditLimit = isHighValue ?
        50000 + Math.floor(Math.random() * 200000) : // $50K-$250K
        5000 + Math.floor(Math.random() * 45000);     // $5K-$50K

      records.push({
        id: `cust_${String(i + 1).padStart(6, '0')}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        creditLimit,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        ssn: this.generateSSN(),
        address: this.generateAddress(),
        phoneNumber: this.generatePhoneNumber(),
        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        lastPurchase: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        accountValue: creditLimit * (0.1 + Math.random() * 0.4) // 10-50% of credit limit
      });
    }

    return records;
  }

  /**
   * Generate realistic SSN for demo (not real SSNs)
   */
  private generateSSN(): string {
    const area = Math.floor(Math.random() * 699) + 1;
    const group = Math.floor(Math.random() * 99) + 1;
    const serial = Math.floor(Math.random() * 9999) + 1;

    return `${String(area).padStart(3, '0')}-${String(group).padStart(2, '0')}-${String(serial).padStart(4, '0')}`;
  }

  /**
   * Generate realistic address
   */
  private generateAddress(): string {
    const streetNumbers = Math.floor(Math.random() * 9999) + 1;
    const streetNames = ['Main St', 'Oak Ave', 'Elm Rd', 'Pine Dr', 'Cedar Ln', 'Maple Way'];
    const cities = ['Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Fairview', 'Madison'];
    const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const zipCode = Math.floor(Math.random() * 90000) + 10000;

    return `${streetNumbers} ${streetName}, ${city}, ${state} ${zipCode}`;
  }

  /**
   * Generate realistic phone number
   */
  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 700) + 200;
    const exchange = Math.floor(Math.random() * 700) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;

    return `(${areaCode}) ${exchange}-${number}`;
  }

  /**
   * Get database statistics for the demo
   */
  getStats() {
    const highValueCustomers = this.records.filter(r => r.creditLimit > 50000).length;
    const totalValue = this.records.reduce((sum, r) => sum + r.accountValue, 0);

    return {
      totalRecords: this.records.length,
      highValueCustomers,
      averageCreditLimit: this.records.reduce((sum, r) => sum + r.creditLimit, 0) / this.records.length,
      totalAccountValue: totalValue,
      paymentMethodDistribution: this.getPaymentMethodDistribution()
    };
  }

  /**
   * Get payment method distribution for demo insights
   */
  private getPaymentMethodDistribution() {
    const distribution: Record<string, number> = {};

    this.records.forEach(record => {
      distribution[record.paymentMethod] = (distribution[record.paymentMethod] || 0) + 1;
    });

    return distribution;
  }
}

// Export singleton instance
export const mockCustomerDB = new MockCustomerDatabase();