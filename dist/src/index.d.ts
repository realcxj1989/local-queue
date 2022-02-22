export interface QueueDto {
    fn: (...args: any) => Promise<any>;
    onSuccess?: (res: any) => any;
    onError?: (res: any) => any;
    args: any[];
    tryTimes?: number;
}
export interface QueueOptions {
    max?: number;
    retryTimes?: number;
    retryType?: number;
}
export declare class Queue {
    private queue;
    private runQueue;
    private promiseQueue;
    private isStart;
    private isStop;
    private max;
    private retryTimes;
    private retryType;
    private eventEmitter;
    logInfo: (msg: string) => void;
    onError: (err: Error, msg?: any) => void;
    constructor(options: QueueOptions);
    maxFormat(max: number): number;
    getMax(): number;
    setMax(max: number): void;
    getRetryTimes(): number;
    setRetryTimes(retryTimes: number): void;
    getRetryType(): number;
    changeRetryType(): void;
    push(body: QueueDto): void;
    unshift(body: QueueDto): void;
    go(body: QueueDto): Promise<void>;
    jump(body: QueueDto): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<unknown>;
    private handlePromise;
}
