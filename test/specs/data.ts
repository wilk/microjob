import helper from '../helper'
import { assert } from 'chai'
import { job } from '../../src/job'

describe('Job Data Testing', () => {
  it('should execute a an inline job with custom data', async () => {
    let error
    let res

    class MyClass {}

    const data = {
      hello: 'world',
      numb: 1000,
      float: 100.50,
      bool: true,
      arr: [10, 20, 'str', { either: 'obj' }],
      myInstance: new MyClass()
    }

    try {
      res = await job(dat => dat, { data })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })
  
  it('should throw a serialization error when passing a function', async () => {
    let error
    let res

    try {
      res = await job(data => console.log(data.fn), { data: { fn: () => console.log('hello there') } })
    } catch (err) {
      error = err
    }

    assert.exists(error)
    assert.equal(error.message, "() => console.log('hello there') could not be cloned.")
    assert.isString(error.stack)
    assert.isUndefined(res)
  })

  it('should throw a serialization error when passing a class', async () => {
    let error
    let res

    try {
      res = await job(data => console.log(data.myClass), { data: { myClass: class {} } })
    } catch (err) {
      error = err
    }

    assert.exists(error)
    assert.equal(error.message, "class {\n                    } could not be cloned.")
    assert.isString(error.stack)
    assert.isUndefined(res)
  })

  it('should execute an inline job with a date inside data', async () => {
    let error
    let res

    const data = { date: new Date() }

    try {
      res = await job(dat => dat, { data })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })

  it('should execute an inline job with a nested data', async () => {
    let error
    let res

    const data = {
      a: {
        complex: {
          json: {
            with: {
              date: new Date()
            }
          }
        }
      }
    }

    try {
      res = await job(dat => dat, { data })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })
})
