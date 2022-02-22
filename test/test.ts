import { Queue, QueueOptions } from "../src";

const p1 = () => {
    return new Promise((resolve => {
        setTimeout(() => {
            return resolve(1)
        }, 600)
    }))
}

const p2 = () => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            return reject("error 2")
        }, 600)
    })
}


const p3 = () => {
    return new Promise((resolve => {
        setTimeout(() => {
            return resolve(3)
        }, 600)
    }))
}

const p4 = (time: number) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            return reject("error 4")
        }, time)
    })
}

class MyQueue extends Queue {
    constructor(options: QueueOptions, logger: any) {
        super(options);
        this.logInfo = (msg => logger.info(msg))
        this.onError = (err, msg) => {
            logger.error(err, msg)
        }
    }
}

const q = new Queue({
    max: 2,
    retryTimes: 3,
    retryType: 0
})
q.push({
    fn: p1,
    args: [],
    onSuccess: (res) => {
        console.log(`p1 方法完成了：结果：${res}`)
    }
})
q.push({
    fn: p2,
    args: [],
    tryTimes: 5,
    onError: (err) => {
        console.log(`p2 方法失败了：结果：${err}`)
    }
})
q.push({ fn: p3, args: [] })
q.jump({ fn: p4, args: [500] })
