# API
This documentation helps using `microjob` with ease, involving simple and quick examples.

## job
**job** can be required directly from microjob:

```js
const {job} = require('microjob')
```

It's a function with this signature:

```ts
function job(handler: Function, config?: Config): Promise<any>
```

**Config** is defined as an object:

```ts
Config<T = {}, U = {}> {
  ctx?: T
  data?: U
}
```

To know how to use it, please refer to the [Job Guide](GUIDE.md#sync-job)

## stop
**stop** can be required directly from microjob:

```js
const {stop} = require('microjob')
```

It's a function with this signature:

```ts
function stop(): void
```

To know how to use it, please refer to the [Teardown Guide](GUIDE.md#graceful-shutdown)
