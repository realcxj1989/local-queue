"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const p1 = () => {
    return new Promise((resolve => {
        setTimeout(() => {
            return resolve(1);
        }, 600);
    }));
};
const p2 = () => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            return reject("error 2");
        }, 600);
    });
};
const p3 = (time, msg) => {
    return new Promise((resolve => {
        setTimeout(() => {
            return resolve(msg);
        }, time);
    }));
};
const p4 = (time) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            return reject("error 4");
        }, time);
    });
};
class MyQueue extends src_1.Queue {
    constructor(options, logger) {
        super(options);
        this.logInfo = (msg => logger.info(msg));
        this.onError = (err, msg) => {
            logger.error(err, msg);
        };
    }
}
const q = new src_1.Queue({
    max: 2,
    retryTimes: 3,
    retryType: 0
});
q.push({
    fn: p1,
    args: [],
    onSuccess: (res) => {
        console.log(`p1 方法完成了：结果：${res}`);
    }
});
q.push({
    fn: p2,
    args: [],
    tryTimes: 5,
    onError: (err) => {
        console.log(`p2 方法失败了：结果：${err}`);
    }
});
q.push({
    fn: p3, args: [500, 'test'],
    onSuccess: (res) => {
        console.log(`p3 方法完成了：结果：${res}`);
    }
});
q.jump({ fn: p4, args: [500] });
//# sourceMappingURL=test.js.map