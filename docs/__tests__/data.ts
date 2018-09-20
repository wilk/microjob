import { job, stop } from '../src/job'

afterAll(() => stop())

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

    expect(error).toBeUndefined()
    expect(res).toEqual(data)
  })
  
  it('should throw a serialization error when passing a function', async () => {
    let error
    let res

    try {
      res = await job(data => console.log(data.fn), { data: { fn: () => console.log('hello there') } })
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual("() => console.log('hello there') could not be cloned.")
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  it('should throw a serialization error when passing a class', async () => {
    let error
    let res

    try {
      res = await job(data => console.log(data.myClass), { data: { myClass: class {} } })
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual("class {\n                    } could not be cloned.")
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
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

    expect(error).toBeUndefined()
    expect(res).toEqual(data)
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

    expect(error).toBeUndefined()
    expect(res).toEqual(data)
  })
})
