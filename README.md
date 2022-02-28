# local-queue

# 一个简单基于内存的并发控制队列

## Installation

```bash
yarn add queue-local
```

or

```bash
npm install -save queue-local
```

## Example

```typescript
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


const p3 = (time: number, msg: string) => {
    return new Promise((resolve => {
        setTimeout(() => {
            return resolve(msg)
        }, time)
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
    max: 2,   // 同时最大可执行数量
    retryTimes: 3,  //执行单元出错重试次数
    retryType: 0  //重试模式 0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
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
q.push({
    fn: p3,
    args: [600, 'test 3'],
    onSuccess: (res) => {
        console.log(`p3 方法完成了：结果：${res}`)
    }
})
q.jump({ fn: p4, args: [500] })
```

## Method

```typescript
export interface QueueDto{
    fn: (args: any) => Promise < any >;
    args: any[];
    onSuccess ? : (res: any) => any;
    onError ? : (res: any) => any;
    tryTimes ? : number;
}
```

| 方法      | 描述                                            | 参数   |
| --------- | ----------------------------------------------- | ------ | 
| push      | 向队列尾部添加任务                    | QueueDto | 
| unshift   |向队列头部添加任务                          | QueueDto | 
| go      | 向队列尾部添加任务，并立刻开始任务                       | QueueDto |
| jump         | 向队列头部添加任务，并立刻开始任务                            | QueueDto | 
| start         | 队列开始执行                                | / | 
| stop    | 队列暂停                           | / | 
| setMax    | 设置最大执行数量                           | number | 
| getMax    | 获取最大执行数量| / | 
| getRetryTimes    | 获取重试次数                           | / | 
| setRetryTimes    | 设置重试次数| number | 
| getRetryType    | 获取重试方式                           | / | 
| changeRetryType    | 改变重试方式| / | 

