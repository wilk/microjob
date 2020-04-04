export const workerFile = `
const { parentPort } = require('worker_threads');

parentPort.on('message', async worker => {
  const response = {
    error: null,
    data: null
  };

  try {
    console.log(worker);
    eval(worker);
    // __executor__ is defined in worker
    response.data = await __executor__();
    parentPort.postMessage(response);
  } catch (err) {
    response.data = null;
    response.error = {
      message: err.message,
      stack: err.stack
    };

    try {
      parentPort.postMessage(response);
    } catch (err) {
      console.error(err);
    }
  }
});
`