import path from 'path'
import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Job Modules Testing', () => {
  it('should execute a an inline job with custom modules', async () => {
    let error

    const modules = {
      fs: 'fs',
      myModule: path.resolve(__dirname, './myModule')
    }

    // foreignKey is used to increase the test coverage
    // @ts-ignore
    modules.__proto__.foreignKey = 'test'

    let val
    try {
      // @ts-ignore
      val = await job(({ modules }) => {
        console.log(modules.fs.readFile)
        console.log(modules.myModule.value)
        return modules.myModule.value
      }, {
          modules
        })
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(val).toBe(10)
  })
})
