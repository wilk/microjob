# Microjob
A tiny wrapper for turning [Node.js threads](https://nodejs.org/api/worker_threads.htm) in easy-to-use routines for high CPU-bound.

## Requirements
**Microjob** can be used only with **Node.js 10.5+** and with the **--experimental-worker** flag activated, otherwise it won't work.

## Quick Example
```js
const { job } = require('microjob')

(async () => {
  try {
    // this function will be executed in another thread
    const res = await job(() => {
      let i = 0
      for (i = 0; i < 1000000; i++) {}

      return i
    })

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }
})()
```

## Documentation
Dive deep into the documentation to know more: **[https://wilk.github.io/microjob/](https://wilk.github.io/microjob/)**
