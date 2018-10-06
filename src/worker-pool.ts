// @ts-ignore
import { Worker } from 'worker_threads'
import os from 'os'
import EventEmitter from 'events'
import { Task, WorkerWrapper } from './interfaces'

const WORKER_STATE_READY = 'ready'
const WORKER_STATE_BUSY = 'busy'

const WORKER_POOL_STATE_ON = 'on'
const WORKER_POOL_STATE_OFF = 'off'

class WorkerPool extends EventEmitter {
  private taskQueue: Task[] = []
  private workers: WorkerWrapper[] = []
  private state = WORKER_POOL_STATE_ON

  constructor(private maxWorkers: number) {
    super()

    this.setup()
  }

  tick(): void {
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
    this.emit('tick', { work, worker })
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

  setup(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(`${__dirname}/worker.js`)

      worker.once('online', () => {
        // next tick, so the worker js gets interpreted
        process.nextTick(() => {
          this.workers.push({
            status: WORKER_STATE_READY,
            worker
          })

          // remove previous listeners, like the startup error handler
          worker.removeAllListeners()

          // if teardown has been called during the setup procedure, repeat it to flush the worker buffer
          if (this.state === WORKER_POOL_STATE_OFF) return this.teardown()

          this.tick()
        })
      })

      // startup error handler: should not be thrown or at least handled
      worker.once('error', (error: Error) => {
        throw error
      })

      if (this.state === WORKER_POOL_STATE_OFF) {
        this.teardown()
        break
      }
    }
  }

  teardown(): void {
    for (let i = 0; i < this.workers.length; i++) {
      // @ts-ignore
      this.workers[i].worker.terminate()
    }

    this.state = WORKER_POOL_STATE_OFF
    this.workers = []
  }
}

export default new WorkerPool(parseInt(process.env.MAX_WORKERS) || os.cpus().length)
