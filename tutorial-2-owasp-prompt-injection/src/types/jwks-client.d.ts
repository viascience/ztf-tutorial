declare module 'jwks-client' {
  export interface JwksClientOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxAge?: number;
    rateLimit?: boolean;
    jwksRequestsPerMinute?: number;
  }

  export interface SigningKey {
    getPublicKey?(): string;
    publicKey?: string;
    rsaPublicKey?: string;
    [key: string]: any; // Allow for other possible properties
  }

  export interface JwksClient {
    getSigningKey(kid: string, callback: (err: Error | null, key?: SigningKey) => void): void;
  }

  declare function jwksClient(options: JwksClientOptions): JwksClient;
  export default jwksClient;
}