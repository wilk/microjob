const {parentPort, workerData} = require('worker_threads');

console.log(`[WK#${workerData.index}] STARTING`)
parentPort.postMessage(`A message from worker #${workerData.index}`)
parentPort.postMessage({a: 10})
for (let i = 0; i < 1000000000; i++) {}
console.log(`[WK#${workerData.index}] FINISHING`)
