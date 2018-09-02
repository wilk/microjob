const {Worker, workerData} = require('worker_threads')

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

const MISSING_HANDLER_ERROR = `
Wrong or missing handler argument. It must be present and it must be a sync|async function.
Try with:
> Task.factory(function myHandler() {...}, config)
` 

module.exports = class Task {
  static factory(handler, config = {ctx: {}, data: {}}) {
    console.log('wat')
    return new Promise((resolve, reject) => {
      if (typeof handler === 'undefined' || handler === null || typeof handler !== 'function') reject(new Error(MISSING_HANDLER_ERROR))
    
      let variables = ''
      for (const key in config.ctx) {
        variables += `let ${key} = ${config.ctx[key]}\n`
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
          response.error = err
        }

        parentPort.postMessage(response)
      })()
      `
      console.log(workerStr)
      const worker = new Worker(workerStr, {
        eval: true,
        workerData: config.data
      })

      worker.on('message', message => {
        if (message.error) reject(message.error)
        else resolve(message.data)

        worker.unref()
      })

      worker.on('error', error => {
        reject(error)
        worker.unref()
      })
    })
  }
}
