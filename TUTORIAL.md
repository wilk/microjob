# Tutorial
This tutorial helps using `microjob` with ease, involving simple and quick examples.

## Sync job
The common and most used example is the sync job.
A sync job is just a function working in background, in another thread, avoiding to block the main thread with heavy CPU load, made of sync function calls.

```js
const { job } = require('microjob')

(async () => {
  try {
    // this function will be executed in another thread
    const res = await job(() => {
      let i = 0
      for (i = 0; i < 1000000; i++) {
        for (let j = 0; j < 1000000; j++) {
          for (let k = 0; k < 1000000; k++) {}
        }
      }

      return i
    })

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }
})()
```

## Async job
An asynchronous job is a task with at least one async call: for instance, a query to a DB, a HTTP request, a file system call, etc, and of course plus a heavy CPU load.

```js
const { job } = require('microjob')

(async () => {
  try {
    // this function will be executed in another thread
    const res = await job(async () => {
      let i = 0
      for (i = 0; i < 1000000; i++) {
        for (let j = 0; j < 1000000; j++) {
          for (let k = 0; k < 1000000; k++) {
            await http.get('www.google.it')
          }
        }
      }

      return i
    })

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }
})()
```
