import { EventEmitter } from "events";

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

export class Queue {
    private queue: QueueDto[] = [];
    private runQueue: QueueDto[] = [];
    private promiseQueue: any = [];
    private isStart = false;
    private isStop = false;
    private max = 5;
    private retryTimes = 0; //执行单元出错重试次数
    private retryType = 1; //重试模式 0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
    private eventEmitter;
    logInfo = (msg: string) => {
        console.log(msg);
    };
    onError = (err: Error, msg?: any) => {
        console.log(err, msg);
    };

    constructor(options: QueueOptions) {
        const { max, retryTimes, retryType } = options;
        if (max) {
            this.max = this.maxFormat(max);
        }
        this.retryTimes = retryTimes ?? this.retryTimes;
        this.retryType = retryType ?? this.retryType;
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.on(
            "retry",
            ({ fn, args, tryTimes, onSuccess, onError }) => {
                if (this.retryType) {
                    this.jump({ fn, args, tryTimes, onSuccess, onError });
                } else {
                    this.go({ fn, args, tryTimes, onSuccess, onError });
                }
            }
        );
    }

    maxFormat(max: number) {
        const _max = +max >> 0;
        if (_max > 0) {
            return _max;
        } else {
            throw new Error('The "max" value is invalid');
        }
    }

    getMax() {
        return this.max;
    }

    setMax(max: number) {
        this.max = this.maxFormat(max);
    }

    getRetryTimes() {
        return this.retryTimes;
    }

    setRetryTimes(retryTimes: number) {
        this.retryTimes = retryTimes;
    }

    getRetryType() {
        return this.retryType;
    }

    changeRetryType() {
        this.retryType = this.retryType === 0 ? 1 : 0;
    }

    push(body: QueueDto) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.push({ fn, args, tryTimes, onSuccess, onError });
    }

    unshift(body: QueueDto) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.unshift({ fn, args, tryTimes, onSuccess, onError });
    }

    async go(body: QueueDto) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.push({ fn, args, tryTimes, onSuccess, onError });
        if (!this.isStart) {
            return this.start();
        }
    }

    async jump(body: QueueDto) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.unshift({ fn, args, tryTimes, onSuccess, onError });
        if (!this.isStart) {
            return this.start();
        }
    }

    async start() {
        this.isStart = true;
        this.isStop = false;
        while (this.queue.length) {
            if (this.runQueue.length < this.max) {
                const data = this.queue.shift();
                if (!data) {
                    continue;
                }
                const { fn, args, tryTimes, onSuccess, onError } = data;
                this.runQueue.push({ fn, args, tryTimes, onSuccess, onError });
                this.promiseQueue.push(fn(...args));
                if (this.queue.length) {
                    continue;
                }
            }
            await Promise.all(this.handlePromise(this.promiseQueue));
            this.runQueue = [];
            this.promiseQueue = [];
            if (this.isStop) {
                this.isStart = false;
                this.eventEmitter.emit("stoped");
                console.log("stop");
                break;
            }
        }
        this.isStart = false;
    }

    async stop() {
        const { eventEmitter } = this;
        return new Promise((resolve) => {
            if (!this.isStart) {
                return resolve(true);
            }
            this.isStop = true;
            eventEmitter.on("stoped", () => {
                return resolve(true);
            });
        });
    }

    private handlePromise(promiseList: Promise<any>[]) {
        return promiseList.map((promise, index) =>
            promise.then(
                (res) => {
                    const data = this.runQueue[index];
                    if (!data) {
                        return res;
                    }
                    const { onSuccess } = data;
                    if (onSuccess) {
                        onSuccess(res);
                    }
                    return res;
                },
                (err) => {
                    const data = this.runQueue[index];
                    if (!data) {
                        return this.onError(err);
                    }
                    const { fn, args, tryTimes, onSuccess, onError } = data;
                    if (tryTimes === undefined || tryTimes >= this.retryTimes) {
                        if (onError) {
                            onError(err);
                        }
                        return this.onError(err, fn);
                    }
                    this.logInfo(
                        `${fn.name} error: ${err}, retry times ${(tryTimes ?? 0) + 1}`
                    );
                    return this.eventEmitter.emit("retry", {
                        fn,
                        args,
                        tryTimes: (tryTimes ?? 0) + 1,
                        onSuccess,
                        onError,
                    });
                }
            )
        );
    }
}
