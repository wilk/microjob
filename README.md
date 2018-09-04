# Thready
A tiny wrapper for turning [Node.js threads](https://nodejs.org/api/worker_threads.htm) in easy-to-use routines for high CPU-bound.

## Requirements
**Thready** can be used only with **Node.js 10.5+** and with the **--experimental-worker** flag activated, otherwise it won't work.

## Quick Example
```js
const { task } = require('thready')

(async () => {
  try {
    // this function will be executed in another thread
    const res = await task(() => {
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
Dive deep into the documentation to know more: **[https://wilk.github.io/thready/docs/](https://wilk.github.io/thready/docs/)**
