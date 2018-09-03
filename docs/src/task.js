const {Worker, workerData} = require('worker_threads')

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

const MISSING_HANDLER_ERROR = `
Wrong or missing handler argument. It must be present and it must be a sync|async function.
Try with:
> Task.factory(function myHandler() {...}, config)
` 

module.exports = class Task {
  static factory(handler, config = {ctx: {}, data: {}}) {
    return new Promise((resolve, reject) => {
      if (typeof handler === 'undefined' || handler === null) return reject(new Error(MISSING_HANDLER_ERROR))

      let worker
      if (typeof handler === 'string') {
        worker = new Worker(handler, {
          workerData: config.data
        })
      } else if (typeof handler === 'function') {
        let variables = ''
        for (const key in config.ctx) {
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
  
        // @todo: issue with functions and classes on postMessage (v8.serialize does not work)
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
        worker = new Worker(workerStr, {
          eval: true,
          workerData: config.data
        })
      } else return reject(new Error(MISSING_HANDLER_ERROR))

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
