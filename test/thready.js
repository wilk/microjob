const {task} = require('../src/thready')
const assert = require('chai').assert

describe('Task testing', () => {
  it('should execute an empty inline task', async () => {
    let error, res
    
    try {
      res = await task(() => {
        let i = 0
        for (i = 0; i < 1000000; i++) {}
  
        return i
      })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.equal(res, 1000000)
  })

  it('should execute a list of inline tasks', async () => {
    let error, results

    let job = () => {
      let i = 0
      for (i = 0; i < 1000000; i++) {}

      return i
    }
    
    try {
      results = await Promise.all([task(job), task(job), task(job)])

    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(results, [1000000, 1000000, 1000000])
  })

  it('should execute a an inline task with custom data', async () => {
    let error, res
    const data = {hello: 'world'}
    
    try {
      res = await task(data => data, {data})
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })

  it('should execute a an inline task with custom context', async () => {
    let error, res
    const ctx = {
      hello: 'world',
      fun: () => console.log('hello world!'),
      numb: 10,
      bool: true,
      obj: {
        nested: 'deep'
      },
      arr: [10, 20, 'meh'],
      myClass: class Foo {constructor() {console.log('hello from constructor')}}
    }
    
    try {
      res = await task(() => ({hello, numb, bool, obj, arr}), {ctx})
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, {hello: ctx.hello, numb: ctx.numb, bool: ctx.bool, obj: ctx.obj, arr: ctx.arr})
  })
})