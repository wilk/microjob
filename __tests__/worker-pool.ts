import { job, start, stop } from '../src/job'
import os from 'os'

const MAX_THREADS = os.cpus().length

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Worker Pool Testing', () => {
  it(`should execute at most ${MAX_THREADS} jobs at a time`, async () => {
    let error
    let diff

    const task = () => new Promise(resolve => setTimeout(() => resolve(), 20))

    try {
      const start = Date.now()
      const promises = []
      for (let i = 0; i < MAX_THREADS; i++) promises.push(job(task))
      promises.push(job(task))
      await Promise.all(promises)
      diff = Date.now() - start
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(diff).toBeGreaterThan(40)
  })
})
