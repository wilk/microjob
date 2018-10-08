import v8 from 'v8'
import workerPool from './worker-pool'
import { Task, Config } from './interfaces'

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

workerPool.on('tick', ({ work, worker }: {work: Task, worker: Worker}) => {
  const { handler, config, resolve, reject } = work

  try {
    let variables = ''
    for (const key in config.ctx) {
      let variable
      switch (typeof config.ctx[key]) {
        case 'string':
          variable = `'${config.ctx[key]}'`
          break
        case 'object':
          console.log(key, config.ctx[key])
          // @todo: discriminate from natural object ({}) and class instances (new Class())
          //        class instances need to have methods attached manually
          variable = JSON.stringify(config.ctx[key])
          break
        default:
          variable = config.ctx[key]
      }
      variables += `let ${key} = ${variable}\n`
    }

    // @ts-ignore
    const dataSerialized = v8.serialize(config.data)
    const dataStr = JSON.stringify(dataSerialized)
    const workerStr = `
    async function __executor__() {
      const v8 = require('v8')
      ${variables}
      const dataParsed = JSON.parse('${dataStr}')
      const dataBuffer = Buffer.from(dataParsed.data)
      const dataDeserialized = v8.deserialize(dataBuffer)
      return await (${handler.toString()})(dataDeserialized)
    }
    `

    console.log(workerStr)

    // @ts-ignore
    worker.once('message', (message: any) => {
      workerPool.free(worker)

      if (typeof message.error === 'undefined' || message.error === null) return resolve(message.data)

      const error = new Error(message.error.message)
      error.stack = message.error.stack
      reject(error)
    })

    // @ts-ignore
    worker.once('error', (error: Error) => {
      workerPool.free(worker)
      reject(error)
    })

    worker.postMessage(workerStr)
  } catch (err) {
    workerPool.free(worker)
    reject(err)
  }
})

export function job<T>(handler: <T>(data?: any) => void, config: Config = { ctx: {}, data: {} }): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object') return reject(new Error(WRONG_CONTEXT_ERROR))

    workerPool.enqueue({ handler, config, resolve, reject })
  })
}

export function stop(): void {
  workerPool.teardown()
}

export function thread(ctx: any = {}): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => PropertyDescriptor {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    /*if (propertyKey === undefined && descriptor === undefined) {
      // @todo: treat it as a factory decorator (function decorator)
    }*/

    const originalMethod = descriptor.value
    descriptor.value = async function (...data) {
      console.log(Object.getPrototypeOf(this), this, target)
      console.log(this.__proto__, this.__prototype__, this.proto, this.prototype)
      console.log(target.__proto__)
      ctx.__instance__ = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
      for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
        console.log(method)
        ctx.__instance__[method] = this[method]
        ctx.__instance__.__proto__[method] = this[method]
      }
      console.log(ctx.__instance__)
      eval(`ctx.__method__ = function(instance, data) {
        const obj = {${originalMethod.toString()}}
        return obj.${propertyKey}.apply(instance, data)
      }`)
      return job(data => {
        // @ts-ignore
        return __method__(__instance__, data)
      }, {ctx, data})
    }
    return descriptor
  }
}
