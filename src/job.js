const { Worker } = require('worker_threads')
const v8 = require('v8')
const os = require('os')

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

const POOL_STATE_READY = 'ready'
const POOL_STATE_STARTING = 'starting'

// todo: spawn os.cpus().length threads
// todo: save them with their ids
// todo: wait for them to be online and then resolve the initialization
// todo: when someone invokes job, send the worker to the job
// todo: then put the worker in the "busy workers list" and free it (put back in the "idle workers list") when it has finished working
// todo: if the idle workers list is empty, spawn a new worker

const availableWorkers = {}
const busyWorkers = {}
const cpusLen = os.cpus().length
let poolState = POOL_STATE_STARTING
function init(config = { poolLimit: cpusLen }) {
  return new Promise((resolve, reject) => {
    config.poolLimit = config.poolLimit || cpusLen
    let onlineWorkers = 0

    function onWorkerOnline() {
      onlineWorkers++
      if (onlineWorkers === config.poolLimit) {
        poolState = POOL_STATE_READY
        resolve()
      }
    }

    function onWorkerError(error) {
      reject(error)
    }

    for (let i = 0; i < config.poolLimit; i++) {
      const worker = new Worker('./src/worker.js')

      worker.once('online', onWorkerOnline)
      worker.once('error', onWorkerError)

      availableWorkers[worker.threadId] = worker
    }
  })
}

const pendingWorkers = []

function initJob({ handler, config, resolve, reject, worker }) {
  try {
    busyWorkers[worker.threadId] = worker
    delete availableWorkers[worker.threadId]

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
        availableWorkers[worker.threadId] = worker
        delete busyWorkers[worker.threadId]
        reject(error)
      } else {
        availableWorkers[worker.threadId] = worker
        delete busyWorkers[worker.threadId]
        resolve(message.data)
      }
    })

    worker.once('error', error => {
      availableWorkers[worker.threadId] = worker
      delete busyWorkers[worker.threadId]
      reject(error)
    })

    worker.postMessage(workerStr)
  } catch (err) {
    availableWorkers[worker.threadId] = worker
    delete busyWorkers[worker.threadId]
    reject(err)
  }
}

function job(handler, config = { ctx: {}, data: {} }) {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object') return reject(new Error(WRONG_CONTEXT_ERROR))

    if (poolState === POOL_STATE_STARTING) return pendingWorkers.push({ handler, config, resolve, reject })

    initJob({handler, config, resolve, reject})
  })
}

module.exports = { job }
