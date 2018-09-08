const { Worker } = require('worker_threads')
const v8 = require('v8')
const os = require('os')

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`
const WRONG_CONTEXT_ERROR = `job needs an object as ctx.\nTry with:\n> job(() => {...}, {ctx: {...}})`

// todo: spawn os.cpus().length threads
// todo: save them with their ids
// todo: wait for them to be online and then resolve the initialization
// todo: when someone invokes job, send the worker to the job
// todo: then put the worker in the "busy workers list" and free it (put back in the "idle workers list") when it has finished working
// todo: if the idle workers list is empty, spawn a new worker

/*for (let i = 0; i < os.cpus().length; i++) {

}*/

function job(handler, config = { ctx: {}, data: {} }) {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

    config.ctx = config.ctx || {}
    config.data = config.data || {}

    if (typeof config.ctx !== 'object') return reject(new Error(WRONG_CONTEXT_ERROR))

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

      const dataStr = JSON.stringify(config.data)
      const workerStr = `
      async function __executor__() {
        ${variables}
        return await (${handler.toString()})(JSON.parse('${dataStr}'))
      }
      `
      v8.serialize(config.data)

      const worker = new Worker('./src/worker.js')

      worker.on('online', () => {
        worker.postMessage(workerStr)
      })

      worker.on('message', message => {
        if (message.error) {
          const error = new Error(message.error.message)
          error.stack = message.error.stack
          reject(error)
        } else resolve(message.data)

        worker.unref()
      })

      worker.on('error', error => {
        reject(error)
        worker.unref()
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { job }
