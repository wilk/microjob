const { Worker } = require('worker_threads')
const v8 = require('v8')
const os = require('os')

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

const POOL_STATE_OFF = 'off'
const POOL_STATE_READY = 'ready'
const POOL_STATE_STARTING = 'starting'

// todo: spawn os.cpus().length threads
// todo: save them with their ids
// todo: wait for them to be online and then resolve the initialization
// todo: when someone invokes job, send the worker to the job
// todo: then put the worker in the "busy workers list" and free it (put back in the "idle workers list") when it has finished working
// todo: if the idle workers list is empty, spawn a new worker

const availableWorkers = new Map()
const busyWorkers = new Map()
let pendingWorkers = []
const cpusLen = os.cpus().length
let poolState = POOL_STATE_STARTING

function stop() {
  pendingWorkers = []

  for (const worker of availableWorkers) {
    worker.terminate()
  }

  for (const worker of busyWorkers) {
    worker.terminate()
  }

  poolState = POOL_STATE_OFF
}

function start(config = { maxWorkers: cpusLen }) {
  return new Promise((resolve, reject) => {
    console.log('*** INIT ***')
    config.maxWorkers = config.maxWorkers || cpusLen
    let onlineWorkers = 0

    async function onWorkerOnline() {
      onlineWorkers++
      if (onlineWorkers === config.maxWorkers) {
        poolState = POOL_STATE_READY

        checkPendingWorkers()

        console.log('*** INIT - FINISHED ***')
        resolve()
      }
    }

    function onWorkerError(error) {
      reject(error)
    }

    console.log('*** INIT - SPAWNING WORKERS ***')
    for (let i = 0; i < config.maxWorkers; i++) {
      const worker = new Worker('./src/worker.js')

      worker.once('online', onWorkerOnline)
      worker.once('error', onWorkerError)

      availableWorkers.set(worker.threadId, worker)
    }
  })
}

async function checkPendingWorkers() {
  console.log('*** CHECK PENDING WORKERS ***')
  if (pendingWorkers.length > 0) {
    const pendingWorker = pendingWorkers.shift()
    try {
      console.log('*** CHECK PENDING WORKERS - FOUND ***')
      const res = await initJob({
        handler: pendingWorker.handler,
        config: pendingWorker.config
      })
      console.log('*** CHECK PENDING WORKERS - RESOLVING ***')
      pendingWorker.resolve(res)
    } catch (err) {
      console.log('*** CHECK PENDING WORKERS - REJECTING ***')
      pendingWorker.reject(err)
    }
  }
}

function freeWorker(worker) {
  console.log('*** FREE WORKER ***')
  availableWorkers.set(worker.threadId, worker)
  busyWorkers.delete(worker.threadId)

  checkPendingWorkers()
}

function initJob({ handler, config }) {
  return new Promise((resolve, reject) => {
    console.log('*** INIT JOB ***')
    process.nextTick(() => {
      console.log('*** INIT JOB - NEXT TICK ***')
      // todo: check again if availableWorkers is empty
      const worker = availableWorkers.values().next().value

      try {
        busyWorkers.set(worker.threadId, worker)
        availableWorkers.delete(worker.threadId)

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

        const dataStr = JSON.stringify(config.data)
        const workerStr = `
        async function __executor__() {
          ${variables}
          return await (${handler.toString()})(JSON.parse('${dataStr}'))
        }
        `

        // serialization precheck, due to this issue: https://github.com/nodejs/node/issues/22736
        v8.serialize(config.data)

        worker.once('message', message => {
          if (message.error) {
            const error = new Error(message.error.message)
            error.stack = message.error.stack
            freeWorker(worker)
            console.log('*** INIT JOB - REJECTING ***')
            reject(error)
          } else {
            freeWorker(worker)
            console.log('*** INIT JOB - RESOLVING ***')
            resolve(message.data)
          }
        })

        worker.once('error', error => {
          freeWorker(worker)
          console.log('*** INIT JOB - REJECTING ***')
          reject(error)
        })

        worker.postMessage(workerStr)
      } catch (err) {
        freeWorker(worker)
        console.log('*** INIT JOB - REJECTING ***')
        reject(err)
      }
    })
  })
}

function job(handler, config = { ctx: {}, data: {} }) {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object') return reject(new Error(WRONG_CONTEXT_ERROR))

    if (poolState === POOL_STATE_STARTING || availableWorkers.size === 0) return pendingWorkers.push({ handler, config, resolve, reject })

    try {
      const res = initJob({ handler, config })
      resolve(res)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { job, start, stop }
