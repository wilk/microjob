# API
This documentation helps using `microjob` with ease, involving simple and quick examples.

## job
**job** can be required directly from microjob:

```js
const {job} = require('microjob')
```

It's a function with this signature:

```ts
function job<T>(handler: <T>(data?: any) => void, config?: Config): Promise<T>;
```

**Config** is defined as an object:

```ts
Config<T = {}, U = {}> {
  ctx?: T
  data?: U
}
```

To know how to use it, please refer to the [Job Guide](GUIDE.md#sync-job)

## start
**start** can be required directly from microjob:

```js
const {start} = require('microjob')
```

Its signature:

```ts
function start(config: SetupConfig): Promise<void>;
```

**SetupConfig** is defined as an object:

```ts
SetupConfig {
  maxWorkers?: number
}
```

To know how to use it, please refer to the [Setup Guide](GUIDE.md#setup)

## stop
**stop** can be required directly from microjob:

```js
const {stop} = require('microjob')
```

It's a function with this signature:

```ts
function stop(): Promise<void>;
```

To know how to use it, please refer to the [Teardown Guide](GUIDE.md#forceful-shutdown)

## workers
**workers** can be required directly from microjob:

```js
const {workers} = require('microjob')
```

It's defined as an array of workers:

```ts
workers: WorkerWrapper[];
```

## kill
**kill** can be required directly from microjob:

```js
const {kill} = require('microjob')
```

It's a function with this signature:

```ts
function kill(worker: WorkerWrapper): Promise<void>;
```

You can use it to directly terminate a specific worker.