import os from 'os'

// this unit is used to increase the test coverage
describe('Process Testing', () => {
  it('should terminate the worker pool using nodejs 12.5+', async () => {
    Object.defineProperty(process, 'version', { value: 'v12.5.0' })
    const { start, stop } = require('../src/job')
    await start()

    await stop()
  })

  it('should warn about the number of CPUs using more than 10 CPUs', async () => {
    Object.defineProperty(os, 'cpus', { value: () => Array.from({ length: 12 }) })
    const { start, stop } = require('../src/job')
    await start()

    await stop()
  })
})
