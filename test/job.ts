import helper from './helper'
import { assert } from 'chai'
import { job } from '../src/job'

describe('Job Testing', () => {
  it('should execute an empty inline job', async () => {
    let error
    let res

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
    let error
    let results

    const task = () => {
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

  it('should not return a function', async () => {
    let error
    let res

    try {
      res = await job(() => (() => console.log('hello there')))
    } catch (err) {
      error = err
    }

    assert.isNotNull(error)
    assert.equal(error.message, "() => console.log('hello there') could not be cloned.")
    assert.isString(error.stack)
    assert.isUndefined(res)
  })

  it('should catch job errors', async () => {
    let error
    let res

    try {
      res = await job(() => { throw new Error('an exception') })
    } catch (err) {
      error = err
    }

    assert.exists(error)
    assert.equal(error.message, 'an exception')
    assert.isString(error.stack)
    assert.isUndefined(res)
  })

  it('should throw an error if the worker is not a function', async () => {
    let error
    let res

    try {
      // @ts-ignore
      res = await job('./worker.js')
    } catch (err) {
      error = err
    }

    assert.exists(error)
    assert.equal(error.message, `job needs a function.\nTry with:\n> job(() => {...}, config)`)
    assert.isString(error.stack)
    assert.isUndefined(res)
  })
  
  it('should throw a serialization error when a class is given back to main thread', async () => {
    let error
    let res

    try {
      res = await job(() => class Person {})
    } catch (err) {
      error = err
    }

    assert.exists(error)
    assert.equal(error.message, "class Person {\n            } could not be cloned.")
    assert.isString(error.stack)
    assert.isUndefined(res)
  })
})
