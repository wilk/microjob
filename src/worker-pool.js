const { Worker } = require('worker_threads')
const os = require('os')

class WorkerPool {
  constructor(maxWorkers) {
    this.taskQueue = []
    this.workers = []

    for (let i = 0; i < maxWorkers; i++) {
      const worker = new Worker('./src/worker.js')

      worker.once('online', () => {
        
      })
      worker.once('error', () => {})

      this.workers.push({
        status: 'idle',
        worker
      })
    }
  }

  next() {

  }
}

module.exports = new WorkerPool(parseInt(process.env.MAX_WORKERS) || os.cpus().length)
