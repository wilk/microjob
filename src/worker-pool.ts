import { Worker } from 'worker_threads'
import os from 'os'
import EventEmitter from 'events'
import { Task, WorkerWrapper } from './interfaces'

const WORKER_STATE_READY = 'ready'
const WORKER_STATE_BUSY = 'busy'

class WorkerPool extends EventEmitter {
  taskQueue: Task[] = []
  workers: WorkerWrapper[] = []

  constructor(maxWorkers: number) {
    super()

    for (let i = 0; i < maxWorkers; i++) {
      const worker = new Worker('./src/worker.js')

      worker.once('online', () => {
        // next tick, so the worker js gets interpreted
        process.nextTick(() => {
          this.workers.push({
            status: WORKER_STATE_READY,
            worker
          })

          // remove previous listeners, like the startup error handler
          worker.removeAllListeners()

          this.tick()
        })
      })

      // startup error handler: should not be thrown or at least handled
      worker.once('error', (error: Error) => {
        throw error
      })
    }
  }

  tick(): void {
    if (this.taskQueue.length === 0) return

    let availableWorker = null
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workers[i].status === WORKER_STATE_READY) {
        availableWorker = this.workers[i]
        break
      }
    }

    if (availableWorker === null) return

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
      if (worker.threadId === this.workers[i].worker.threadId) {
        this.workers[i].status = WORKER_STATE_READY
        // remove previous listeners
        this.workers[i].worker.removeAllListeners()
        this.tick()
        break
      }
    }
  }

  teardown(): void {
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].worker.terminate()
    }
  }
}

export default new WorkerPool(parseInt(process.env.MAX_WORKERS) || os.cpus().length)
