"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const events_1 = require("events");
class Queue {
    constructor(options) {
        this.queue = [];
        this.runQueue = [];
        this.promiseQueue = [];
        this.isStart = false;
        this.isStop = false;
        this.max = 5;
        this.retryTimes = 0;
        this.retryType = 1;
        this.logInfo = (msg) => {
            console.log(msg);
        };
        this.onError = (err, msg) => {
            console.log(err, msg);
        };
        const { max, retryTimes, retryType } = options;
        if (max) {
            this.max = this.maxFormat(max);
        }
        this.retryTimes = retryTimes !== null && retryTimes !== void 0 ? retryTimes : this.retryTimes;
        this.retryType = retryType !== null && retryType !== void 0 ? retryType : this.retryType;
        this.eventEmitter = new events_1.EventEmitter();
        this.eventEmitter.on("retry", ({ fn, args, tryTimes, onSuccess, onError }) => {
            if (this.retryType) {
                this.jump({ fn, args, tryTimes, onSuccess, onError });
            }
            else {
                this.go({ fn, args, tryTimes, onSuccess, onError });
            }
        });
    }
    maxFormat(max) {
        const _max = +max >> 0;
        if (_max > 0) {
            return _max;
        }
        else {
            throw new Error('The "max" value is invalid');
        }
    }
    getMax() {
        return this.max;
    }
    setMax(max) {
        this.max = this.maxFormat(max);
    }
    getRetryTimes() {
        return this.retryTimes;
    }
    setRetryTimes(retryTimes) {
        this.retryTimes = retryTimes;
    }
    getRetryType() {
        return this.retryType;
    }
    changeRetryType() {
        this.retryType = this.retryType === 0 ? 1 : 0;
    }
    push(body) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.push({ fn, args, tryTimes, onSuccess, onError });
    }
    unshift(body) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.unshift({ fn, args, tryTimes, onSuccess, onError });
    }
    async go(body) {
        const { fn, args, tryTimes = 0, onSuccess, onError } = body;
        this.queue.push({ fn, args, tryTimes, onSuccess, onError });
        if (!this.isStart) {
            return this.start();
        }
    }
    async jump(body) {
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
            const result = await Promise.allSettled(this.promiseQueue);
            result.forEach((item, index) => {
                const data = this.runQueue[index];
                if (item.status === 'fulfilled') {
                    if (!data) {
                        return item.value;
                    }
                    const { onSuccess } = data;
                    if (onSuccess) {
                        onSuccess(item.value);
                    }
                }
                else {
                    const { reason } = item;
                    if (!data) {
                        return this.onError(reason);
                    }
                    const { fn, args, tryTimes, onSuccess, onError } = data;
                    if (tryTimes === undefined || tryTimes >= this.retryTimes) {
                        if (onError) {
                            onError(reason);
                        }
                        return this.onError(reason, fn);
                    }
                    this.logInfo(`${fn.name} error: ${reason}, retry times ${(tryTimes !== null && tryTimes !== void 0 ? tryTimes : 0) + 1}`);
                    return this.eventEmitter.emit("retry", {
                        fn,
                        args,
                        tryTimes: (tryTimes !== null && tryTimes !== void 0 ? tryTimes : 0) + 1,
                        onSuccess,
                        onError,
                    });
                }
            });
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
}
exports.Queue = Queue;
//# sourceMappingURL=index.js.map