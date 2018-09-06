const { Worker } = require('worker_threads')
const v8 = require('v8')

const MISSING_HANDLER_ERROR = `job needs a function.\nTry with:\n> job(() => {...}, config)`

function job(handler, config = { ctx: {}, data: {} }) {
  return new Promise((resolve, reject) => {
    if (typeof handler !== 'function') return reject(new Error(MISSING_HANDLER_ERROR))

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

      const workerStr = `
      (async function () {
        const {parentPort, workerData} = require('worker_threads')
        ${variables}
        const response = {
          err: null,
          data: null
        }
        
        try {
          response.data = await (${handler.toString()})(workerData)
        } catch (err) {
          response.error = {
            message: err.message,
            stack: err.stack
          }
        }

        try {
          parentPort.postMessage(response)
        } catch (err) {
          response.data = null
          response.error = {
            message: err.message,
            stack: err.stack
          }
          parentPort.postMessage(response)
        }
      })()
      `

      // check for serialization's error, due to this issue: https://github.com/nodejs/node/issues/22736
      v8.serialize(config.data)
      const worker = new Worker(workerStr, {
        eval: true,
        workerData: config.data
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
