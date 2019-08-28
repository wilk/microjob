// @ts-ignore
import { Worker } from 'worker_threads'
import v8 from 'v8'
import os from 'os'
import path from 'path'
import { Task, WorkerWrapper, SetupConfig } from './interfaces'

const WORKER_STATE_READY = 'ready'
const WORKER_STATE_SPAWNING = 'spawning'
const WORKER_STATE_BUSY = 'busy'
const WORKER_STATE_OFF = 'off'

const AVAILABLE_CPUS = os.cpus().length

class WorkerPool {
  private maxWorkers = AVAILABLE_CPUS
  private taskQueue: Task[] = []
  private workers: WorkerWrapper[] = []

  resurrect(deadWorker: WorkerWrapper): void {
    // self healing procedure
    const worker = new Worker(path.resolve(__dirname, './worker.js'))

    deadWorker.status = WORKER_STATE_SPAWNING
    deadWorker.worker = worker

    worker.once('online', () =>
      // next tick, so the worker js gets interpreted
      process.nextTick(() => {
        deadWorker.status = WORKER_STATE_READY

        // remove previous listeners, like the startup error handler
        // @ts-ignore
        worker.removeAllListeners()

        this.tick()
      })
    )

    // startup error handler: should not be thrown or at least handled
    worker.once('error', (error: Error) => {
      console.error(error)
      deadWorker.status = WORKER_STATE_OFF
      // @ts-ignore
      worker.removeAllListeners()

      this.tick()
    })
  }

  tick(): void {
    // check for dead threads and resurrect them
    this.workers
      .filter(({ status }) => status === WORKER_STATE_OFF)
      .forEach((deadWorker: WorkerWrapper) => this.resurrect(deadWorker))

    if (this.taskQueue.length === 0) return

    let availableWorker: WorkerWrapper
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workers[i].status === WORKER_STATE_READY) {
        availableWorker = this.workers[i]
        break
      }
    }

    if (typeof availableWorker === 'undefined') return

    const work = this.taskQueue.shift()

    availableWorker.status = WORKER_STATE_BUSY
    const { worker } = availableWorker
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
      const persistentCtxStr = JSON.stringify(config.persistentCtx || {})
      const workerStr = `
      async function __executor__(persistentCtx) {
        const v8 = require('v8')
        ${variables}
        const dataParsed = JSON.parse('${dataStr}')
        const dataBuffer = Buffer.from(dataParsed.data)
        const dataDeserialized = v8.deserialize(dataBuffer)
        return await (${handler.toString()})(dataDeserialized)
      }

      __executor__.persistentCtx = JSON.parse('${persistentCtxStr}')
      `

      // @ts-ignore
      worker.once('message', (message: any) => {
        this.free(worker)

        if (typeof message.error === 'undefined' || message.error === null)
          return resolve(message.data)

        const error = new Error(message.error.message)
        error.stack = message.error.stack
        reject(error)
      })

      // @ts-ignore
      worker.once('error', (error: Error) => {
        availableWorker.status = WORKER_STATE_OFF
        reject(error)
        this.tick()
      })

      worker.postMessage(workerStr)
    } catch (err) {
      this.free(worker)
      reject(err)
    }
  }

  enqueue({ handler, config, resolve, reject }: Task): void {
    this.taskQueue.push({ handler, config, resolve, reject })
    this.tick()
  }

  free(worker: any): void {
    for (let i = 0; i < this.workers.length; i++) {
      // @ts-ignore
      if (worker.threadId === this.workers[i].worker.threadId) {
        this.workers[i].status = WORKER_STATE_READY
        // remove previous listeners
        // @ts-ignore
        this.workers[i].worker.removeAllListeners()
        this.tick()
        break
      }
    }
  }

  setup(config: SetupConfig = { maxWorkers: AVAILABLE_CPUS }): Promise<void> {
    this.maxWorkers = config.maxWorkers > 0 ? config.maxWorkers : AVAILABLE_CPUS

    if (this.maxWorkers > 10) console.warn(`Worker pool has more than 10 workers.\nYou should also increase the Max Listeners of Node.js (https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n)\nOtherwise, limit them with start({maxWorkers: 10})`)

    return new Promise((resolve, reject) => {
      let counterSuccess = 0
      let counterFailure = 0
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(`${__dirname}/worker.js`)

        this.workers.push({
          status: WORKER_STATE_SPAWNING,
          worker
        })

        worker.once(
          'online',
          (index => () => {
            // next tick, so the worker js gets interpreted
            process.nextTick(() => {
              this.workers[index].status = WORKER_STATE_READY

              // remove previous listeners, like the startup error handler
              // @ts-ignore
              this.workers[index].worker.removeAllListeners()

              counterSuccess++

              // if there's at least one working thread, go ahead
              if (
                counterSuccess > 0 &&
                counterSuccess + counterFailure === this.maxWorkers
              )
                resolve()
            })
          })(i)
        )

        // startup error handler: should not be thrown or at least handled
        worker.once(
          'error',
          (index => (error: Error) => {
            this.workers[index].status = WORKER_STATE_OFF
            // @ts-ignore
            this.workers[index].worker.removeAllListeners()
            counterFailure++

            // stop the worker pool if no worker is spawned
            if (counterFailure === this.maxWorkers) {
              reject(error)
            }
          })(i)
        )
      }
    })
  }

  async teardown(): Promise<void> {
    const terminationPromises = []

    for (const { worker } of this.workers) {
      // @ts-ignore
      terminationPromises.push(worker.terminate())
    }

    await Promise.all(terminationPromises)
    this.workers = []
  }
}

export default new WorkerPool()
