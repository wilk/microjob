import { job, stop, thread } from '../src/job'

afterAll(() => stop())

describe('Job Testing', () => {
  xit('should execute an empty inline job', async () => {
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

    expect(error).toBeUndefined()
    expect(res).toBe(1000000)
  })

  xit('should execute a list of inline jobs', async () => {
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

    expect(error).toBeUndefined()
    expect(results).toEqual([1000000, 1000000, 1000000])
  })

  xit('should not return a function', async () => {
    let error
    let res

    try {
      res = await job(() => (() => console.log('hello there')))
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual("() => console.log('hello there') could not be cloned.")
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  xit('should catch job errors', async () => {
    let error
    let res

    try {
      res = await job(() => { throw new Error('an exception') })
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual('an exception')
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  xit('should throw an error if the worker is not a function', async () => {
    let error
    let res

    try {
      // @ts-ignore
      res = await job('./worker.js')
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual(`job needs a function.\nTry with:\n> job(() => {...}, config)`)
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  xit('should throw a serialization error when a class is given back to main thread', async () => {
    let error
    let res

    try {
      res = await job(() => class Person {})
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual('class Person {\n            } could not be cloned.')
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  it('should execute a method into a separated thread', async () => {
    let error
    let res

    try {
      class Person {
        constructor(private name: string) {
          console.log(`hey from ${this.name}`)
        }

        @thread()
        hello(sentence: string): string {
          return `hey from ${this.name}: ${sentence}`
        }
      }

      const foo = new Person('foo')
      res = await foo.hello('the sentence')
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toBe(`hey from foo: the sentence`)
  })
})
