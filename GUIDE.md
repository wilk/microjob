# Guide
This documentation helps using `microjob` with ease, involving simple and quick examples.

## Worker Pool
![Worker Pool](https://upload.wikimedia.org/wikipedia/commons/0/0c/Thread_pool.svg "Worker Pool")

[Image taken from Wikipedia](https://en.wikipedia.org/wiki/Thread_pool#/media/File:Thread_pool.svg)

microjob implements the [Thread Pool pattern](https://en.wikipedia.org/wiki/Thread_pool), called worker pool.
The worker pool spawns a set of threads, default equals to the number of cpus.
It can be tuned with the environment variable `MAX_WORKERS`:

```bash
$ export MAX_WORKERS=10; node --experimental-worker index.js
```

Invoking `job` on a function will put it on a task queue and then, when a worker is available, it will be executed, returning the desired result or an error.

## Sync job
The common and most used example is the sync job.
A sync job is just a function working in background, in another thread, avoiding to block the main thread with heavy CPU load, made of sync function calls.

```js
(async () => {
  const { job } = require('microjob')

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
(async () => {
  const { job } = require('microjob')

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

## Job data
Passing custom data to the job is quite easy as calling a function:

```js
(async () => {
  const { job } = require('microjob')

  try {
    // this function will be executed in another thread
    const res = await job(data => {
      let i = 0
      for (i = 0; i < data.counter; i++) {}

      return i
    }, {data: {counter: 1000000}})

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }
})()
```

Both data passed to the worker and the returned one are serialized with [v8 serializer](https://nodejs.org/api/v8.html#v8_v8_serialize_value): this means that only some JS data structures are allowed (for instance, functions and classes are forbidden).

## Job context
It's a common practice using the upper scope of the function's container to reuse the already defined variables.

**Context is evaluated inside the worker thread. This means it needs to be sanitized before passing it to microjob.
An attacker could perform a JS injection as described [in this issue](https://github.com/wilk/microjob/issues/2)**

Achieving the same result can be done by passing the context object:

```js
(async () => {
  const { job } = require('microjob')

  try {
    // this function will be executed in another thread
    const counter = 1000000
    const res = await job(() => {
      let i = 0
      for (i = 0; i < counter; i++) {}

      return i
    }, {ctx: {counter}})

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }
})()
```

## Forceful shutdown
When you don't need microjob anymore, you can shut it down with the `stop` function:

```js
(async () => {
  const { job, stop } = require('microjob')

  try {
    // this function will be executed in another thread
    const counter = 1000000
    const res = await job(() => {
      let i = 0
      for (i = 0; i < counter; i++) {}

      return i
    }, {ctx: {counter}})

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }

  stop()
})()
```

`stop` ensures that every worker of the worker pool is [terminated](https://nodejs.org/api/worker_threads.html#worker_threads_worker_terminate_callback).
