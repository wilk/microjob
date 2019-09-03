const { parentPort } = require('worker_threads')

let persistentCtx = {}

parentPort.on('message', async worker => {
  const response = {
    error: null,
    data: null
  }

  try {
    eval(worker)
    // __executor__ is defined in worker
    Object.assign(persistentCtx, __executor__.persistentCtx)
    response.data = await __executor__(persistentCtx)
    parentPort.postMessage(response)
  } catch (err) {
    response.data = null
    response.error = {
      message: err.message,
      stack: err.stack
    }

    try {
      parentPort.postMessage(response)
    } catch (err) {
      console.error(err)
    }
  }
})
