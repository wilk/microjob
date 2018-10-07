import { job } from '../src/job'

afterAll(() => stop())

describe('Worker Pool Testing', () => {
  // todo: find a better way to test worker pool
  xit('should execute at most 4 jobs at a time', async () => {
    let error
    let diff

    const task = () => new Promise(resolve => setTimeout(() => resolve(), 20))

    try {
      const start = Date.now()
      await Promise.all([job(task), job(task), job(task), job(task), job(task)])
      diff = Date.now() - start
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(diff).toBeGreaterThan(40)
  })
})
