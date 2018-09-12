const { assert } = require('chai')
const { job, stop } = require('../src/job')

describe('Job Data Testing', () => {
  it('should execute a an inline job with custom data', async () => {
    let error
    let res

    const data = { hello: 'world' }

    try {
      res = await job(dat => dat, { data })
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.deepEqual(res, data)
  })

  it('should throw a serialization error for wrong data', async () => {
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

  it('should execute a an inline job with a date inside data', async () => {
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

  after(() => {
    stop()
  })
})
