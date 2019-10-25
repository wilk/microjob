import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Job Shared Testing', () => {
  it('should mutate shared inside job', async () => {
    const sab = new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT)
    const shared = new Float64Array(sab)
    shared[0] = 1

    await job(
      () => {
        shared[0] = 2
      },
      { shared }
    )

    expect(shared[0]).toEqual(2)
  })
})
