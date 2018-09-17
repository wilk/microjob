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
      if (!config.ctx.hasOwnProperty(key)) continue

      let variable
      switch (typeof config.ctx[key]) {
        case 'string':
          variable = `'${config.ctx[key]}'`
          break
        case 'object':
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

export function job(handler: Function, config: Config = { ctx: {}, data: {} }) {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object') return reject(new Error(WRONG_CONTEXT_ERROR))

    workerPool.enqueue({ handler, config, resolve, reject })
  })
}

export function stop() {
  workerPool.teardown()
}
