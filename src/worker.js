const { parentPort } = require('worker_threads')

parentPort.on('message', async worker => {
  const response = {
    err: null,
    data: null
  }

  try {
    eval(worker)
    // __executor__ is defined in worker
    response.data = await __executor__()
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
})