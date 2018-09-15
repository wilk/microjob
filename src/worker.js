const { parentPort } = require('worker_threads')

console.log('AYO')
parentPort.on('message', async worker => {
  console.log('HEY')
  const response = {
    error: null,
    data: null
  }

  try {
    eval(worker)
    // __executor__ is defined in worker
    response.data = await __executor__()
    console.log('AYO')
    console.log(parentPort.postMessage)
    parentPort.postMessage(response)
  } catch (err) {
    console.log('STICAZZI?')
    response.data = null
    response.error = {
      message: err.message,
      stack: err.stack
    }
    parentPort.postMessage(response)
  }
})
