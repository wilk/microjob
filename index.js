const {Worker, workerData} = require('worker_threads');

for (let i = 0; i < 3; i++) {
  const worker = new Worker('./worker.js', {
    workerData: {
      index: i
    }
  })
  worker.on('message', message => console.log(`[MT] - ${message}`))
  worker.on('error', error => console.error(`[MT] - ${error}`))
  worker.on('exit', code => console.error(`[MT] - exit with code #${code}`))
}

for (let i = 0; i < 3; i++) {
  const worker = new Worker(`
  const {parentPort, workerData} = require('worker_threads');
  console.log('[WKE#' + workerData.index + '] STARTING')
  parentPort.postMessage('A message from worker #' + workerData.index)
  for (let i = 0; i < 1000000000; i++) {}
  console.log('[WKE#' + workerData.index + '] FINISHING')  
  `, {
    eval: true,
    workerData: {
      index: i
    }
  })
  worker.on('message', message => console.log(`[MTE] - ${message}`))
  worker.on('error', error => console.error(`[MTE] - ${error}`))
  worker.on('exit', code => console.error(`[MTE] - exit with code #${code}`))
}
