const { parentPort, workerData } = require('worker_threads')

parentPort.on('message', async worker => {
  const response = {
    err: null,
    data: null
  }

  try {
    console.log(worker)
    eval(worker)
    response.data = await executor(workerData)
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