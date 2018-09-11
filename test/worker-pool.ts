import { assert } from 'chai'
import { job, stop } from '../src/job'

describe('Worker Pool Testing', () => {
  it('should execute at most 4 jobs at a time', async () => {
    let error
    let diff

    const task = () => new Promise(resolve => setTimeout(() => resolve(), 10))

    try {
      const start = Date.now()
      await Promise.all([job(task), job(task), job(task), job(task), job(task)])
      diff = Date.now() - start
    } catch (err) {
      error = err
    }

    assert.isUndefined(error)
    assert.isAbove(diff, 10 * 2)
  })

  after(() => {
    stop()
  })
})
