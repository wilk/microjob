import { job, stop, thread } from '../src/job'

afterAll(() => stop())

describe('Thread Testing', () => {
  it('should execute a method into a separated thread', async () => {
    let error
    let res
    const name = 'foo'
    const surname = 'bar'
    const sentence = 'hello world'

    try {
      class Person {
        constructor(private name: string) {}

        @thread({surname})
        hello(sentence: string): string {
          // @ts-ignore
          return `hey from ${this.name} ${surname}: ${sentence}`
        }
      }

      const foo = new Person(name)
      res = await foo.hello(sentence)
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toBe(`hey from ${name} ${surname}: ${sentence}`)
  })

  it('should catch job errors', async () => {
    let error
    let res

    try {
      class Person {
        @thread()
        hello(): string {
          throw new Error('an exception')
        }
      }

      const foo = new Person()
      res = await foo.hello()
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toEqual('an exception')
    expect(typeof error.stack).toBe('string')
    expect(res).toBeUndefined()
  })

  it('should execute a function passed from context', async () => {
    let error
    let res
    const sum = (a, b) => a + b

    try {
      class Calculator {
        @thread({sum})
        calculate(a, b: number): number {
          // @ts-ignore
          return sum(a, b)
        }
      }

      const calc = new Calculator()
      res = await calc.calculate(10, 20)
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toBe(sum(10, 20))
  })

  it('should execute a method from the decorated one', async () => {
    let error
    let res

    try {
      class Calculator {
        sum(a, b: number): number {
          return a + b
        }

        @thread()
        calculate(a, b: number): number {
          return this.sum(a, b)
        }
      }

      const calc = new Calculator()
      res = await calc.calculate(10, 20)
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toBe(30)
  })
})
