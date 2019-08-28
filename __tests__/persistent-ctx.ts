import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Persistent ctx testing', () => {
  it('should return persistent ctx after save', async () => {
    await job(() => {}, {persistentCtx: {test: true}})
    const persistentCtx = await job(() => {
      return persistentCtx
    })
    expect(persistentCtx).toEqual({test: true})
  })
})
