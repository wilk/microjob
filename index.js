const {Worker, workerData} = require('worker_threads')
const v8 = require('v8')
const Task = require('./src/task')

mmm = async () => {
  try {
    const config = {ctx: {a: 10}, data: {meh: 20}}
    const res = await Task.factory(data => {
      console.log('lel from thread')
      return new Promise((resolve, reject) => {
        console.log('DATA FROM THREAD', data)
        setTimeout(() => {
          if (a === 10) resolve('YEAH')
          else reject('NOPE')
        }, 2000)
      })
    }, config)
    console.log(res)
  } catch (err) {
    console.error(err)
  }
}
mmm()
const data = {b: 20}
const ctx = {a: 10}
Task.factory(data => {
  const fs = require('fs')

  const file = fs.readFileSync('./package.json', 'utf-8')
  console.log('file')
  console.log(file)
}, {data, ctx})
  .then(() => console.log('YEAH'), err => console.error(err))

for (let i = 0; i < 3; i++) {
  const worker = new Worker('./worker.js', {
    workerData: {
      index: i
    }
  })
  worker.on('message', message => console.log(message))
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
