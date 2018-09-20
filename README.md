# Microjob
[![Build Status](https://travis-ci.org/wilk/microjob.svg?branch=master)](https://travis-ci.org/wilk/microjob)
[![Coverage Status](https://coveralls.io/repos/github/wilk/microjob/badge.svg?branch=feature%2Fcoverage)](https://coveralls.io/github/wilk/microjob?branch=feature%2Fcoverage)

A tiny wrapper for turning [Node.js threads](https://nodejs.org/api/worker_threads.html) in easy-to-use routines for CPU-bound.

![When my multithreaded program works like a charm](https://ljdchost.com/K074MgM.gif)

[When my multithreaded program works like a charm - thecodinglove](https://thecodinglove.com/when-my-multithreaded-program-works-like-a-charm)

## Introduction
Microjob is a tiny wrapper for Node.js threads and is intended to perform heavy CPU loads using anonymous functions.
So, Microjob treats Node.js threads as temporary working units: if you need to spawn a long-living thread, then you should use the [default API](https://nodejs.org/api/worker_threads.html).

Microjob follows the same line of the original Node.js documentation: use it only for CPU-bound jobs and not for I/O-bound purposes.
Quoting the documentation:

> Workers are useful for performing CPU-intensive JavaScript operations; do not use them for I/O, since Node.js’s built-in mechanisms for performing operations asynchronously already treat it more efficiently than Worker threads can.

**Microjob** can be used only with **Node.js 10.5+** and with the **--experimental-worker** flag activated, otherwise it won't work.

More details explained in: **[Microjob: a tiny multithreading library for Node.js](https://hackernoon.com/microjob-a-tiny-multithreading-library-for-node-js-92d0500b07d5)**

## Installation
Via **npm**:

```bash
$ npm install --save microjob
```

## Quick Example
```js
(async () => {
  const { job, stop } = require('microjob')

  try {
    // this function will be executed in another thread
    const res = await job(() => {
      let i = 0
      for (i = 0; i < 1000000; i++) {
        // heavy CPU load ...
      }

      return i
    })

    console.log(res) // 1000000
  } catch (err) {
    console.error(err)
  }

  // graceful shutdown
  stop()
})()
```

## Documentation
Dive deep into the documentation to find more examples: **[Guide](GUIDE.md)**

## Known Issues
* **[sanitize worker context](API.md#job-context)**

## Known Limitations
* **[serialize worker data](API.md#job-data)**
