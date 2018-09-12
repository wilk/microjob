const { assert } = require('chai')
const { job, stop } = require('../src/job')

describe('Job Context Testing', () => {
  it('should execute a an inline job with custom context', async () => {
    let error
    let res

    const ctx = {
      hello: 'world',
      fun: () => console.log('hello world!'),
      numb: 10,
      bool: true,
      obj: {
        nested: 'deep'
      },
      date: new Date(),
      arr: [10, 20, 'meh'],
      myClass: class Foo {constructor() { console.log('hello from constructor') }}
    }

    try {
      res = await job(() => ({ hello, numb, bool, obj, arr, date }), { ctx })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, { hello: ctx.hello, numb: ctx.numb, bool: ctx.bool, obj: ctx.obj, arr: ctx.arr })
  })

  after(() => {
    stop()
  })
})
