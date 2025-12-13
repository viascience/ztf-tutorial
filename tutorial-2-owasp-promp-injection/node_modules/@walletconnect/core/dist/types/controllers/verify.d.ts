import { Logger } from "@walletconnect/logger";
import { IVerify } from "@walletconnect/types";
export declare class Verify extends IVerify {
    projectId: string;
    logger: Logger;
    name: string;
    private verifyUrl;
    private iframe?;
    private initialized;
    private abortController;
    private isDevEnv;
    private queue;
    private verifyDisabled;
    constructor(projectId: string, logger: Logger);
    init: IVerify["init"];
    register: IVerify["register"];
    resolve: IVerify["resolve"];
    get context(): string;
    private fetchAttestation;
    private addToQueue;
    private processQueue;
    private sendPost;
    private createIframe;
    private onInit;
    private startAbortTimer;
    private removeIframe;
    private getVerifyUrl;
}
//# sourceMappingURL=verify.d.ts.map