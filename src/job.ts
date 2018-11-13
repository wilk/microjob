import workerPool from './worker-pool'
import { Config } from './interfaces'

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

export function job<T>(
  handler: <T>(data?: any) => void,
  config: Config = { ctx: {}, data: {} }
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function')
      return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object')
      return reject(new Error(WRONG_CONTEXT_ERROR))

    workerPool.enqueue({ handler, config, resolve, reject })
  })
}

export const stop = workerPool.teardown.bind(workerPool)
export const start = workerPool.setup.bind(workerPool)
