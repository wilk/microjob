const { Worker } = require('worker_threads')
const os = require('os')
const EventEmitter = require('events')

const WORKER_STATE_READY = 'ready'
const WORKER_STATE_BUSY = 'busy'

class WorkerPool extends EventEmitter {
  constructor(maxWorkers) {
    super()

    this.taskQueue = []
    this.workers = []

    for (let i = 0; i < maxWorkers; i++) {
      const worker = new Worker('./src/worker.js')

      worker.once('online', () => {
        this.workers.push({
          status: WORKER_STATE_READY,
          worker
        })

        this.tick()
      })
      worker.once('error', () => {
        // todo: what to do if a thread doesn't come up? retry? raise an exception?
      })
    }
  }

  tick() {
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

  enqueue({ handler, config, resolve, reject }) {
    this.taskQueue.push({ handler, config, resolve, reject })
    this.tick()
  }

  free(worker) {
    for (let i = 0; i < this.workers.length; i++) {
      if (worker.threadId === this.workers[i].worker.threadId) {
        this.workers[i].status = WORKER_STATE_READY
        break
      }
    }
  }

  teardown() {
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].worker.unref()
    }
  }
}

module.exports = new WorkerPool(parseInt(process.env.MAX_WORKERS) || os.cpus().length)
