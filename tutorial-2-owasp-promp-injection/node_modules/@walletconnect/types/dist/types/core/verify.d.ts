import { Logger } from "@walletconnect/logger";
export declare namespace Verify {
    interface Context {
        verified: {
            origin: string;
            validation: "UNKNOWN" | "VALID" | "INVALID";
            verifyUrl: string;
            isScam?: boolean;
        };
    }
}
export declare abstract class IVerify {
    projectId: string;
    logger: Logger;
    abstract readonly context: string;
    constructor(projectId: string, logger: Logger);
    abstract init(params?: {
        verifyUrl?: string;
    }): Promise<void>;
    abstract register(params: {
        attestationId: string;
    }): Promise<void>;
    abstract resolve(params: {
        attestationId: string;
        verifyUrl?: string;
    }): Promise<{
        origin: string;
        isScam?: boolean;
    }>;
}
//# sourceMappingURL=verify.d.ts.map