const {job} = require('../src/job')
const {assert} = require('chai')

describe('Job testing', () => {
  it('should execute an empty inline job', async () => {
    let error, res
    
    try {
      res = await job(() => {
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

  it('should execute a list of inline jobs', async () => {
    let error, results

    let task = () => {
      let i = 0
      for (i = 0; i < 1000000; i++) {}

      return i
    }
    
    try {
      results = await Promise.all([job(task), job(task), job(task)])

    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(results, [1000000, 1000000, 1000000])
  })

  it('should execute a an inline job with custom data', async () => {
    let error, res
    const data = {hello: 'world'}
    
    try {
      res = await job(data => data, {data})
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })

  it('should execute a an inline job with custom context', async () => {
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
      res = await job(() => ({hello, numb, bool, obj, arr}), {ctx})
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, {hello: ctx.hello, numb: ctx.numb, bool: ctx.bool, obj: ctx.obj, arr: ctx.arr})
  })
})