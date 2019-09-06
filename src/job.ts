import workerPool from './worker-pool'
import { Config } from './interfaces'
import { SetupConfig } from './interfaces'

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

export function job<T, U extends {}, V extends {}>(
  handler: (data: V) => T,
  config: Config<U, V> = { ctx: {} as U, data: {} as V }
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function')
      return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {} as U
    config.data = config.data || {} as V

    if (typeof config.ctx !== 'object')
      return reject(new Error(WRONG_CONTEXT_ERROR))

    workerPool.enqueue({ handler, config, resolve, reject })
  })
}

export const stop: () => Promise<void> = workerPool.teardown.bind(workerPool)
export const start: (config?: SetupConfig) => Promise<void> = workerPool.setup.bind(workerPool)
