import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Job Context Testing', () => {
  it('should execute a an inline job with custom context', async () => {
    let error
    let res

    class Foo {}

    const ctx = {
      hello: 'world',
      fun: () => console.log('hello world!'),
      numb: 10,
      bool: true,
      obj: {
        nested: 'deep' /*,
        date: new Date()*/
      },
      // date: new Date(),
      arr: [10, 20, 'meh'],
      myClass: Foo,
      myInstance: new Foo()
    }

    try {
      // @ts-ignore
      res = await job(() => ({ hello, numb, bool, obj, arr /*, date*/ }), {
        ctx
      })
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toEqual({
      hello: ctx.hello,
      numb: ctx.numb,
      bool: ctx.bool,
      obj: ctx.obj,
      arr: ctx.arr
    })
  })

  it('should execute a function defined in context', async () => {
    let error
    let res

    const ctx = {
      arrowFun: () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      },
      fun: function() {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }
    }

    try {
      // @ts-ignore
      res = await job(() => [fun(), arrowFun()], { ctx })
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toEqual([499500, 499500])
  })

  // todo: implement instance serialization
  xit('should execute a an inline job passing object instances to context', async () => {
    let error
    let res

    class Person {
      constructor(private name, private surname) {}

      fullname() {
        return `${this.name} ${this.surname}`
      }
    }

    const ctx = {
      foo: new Person('foo', 'bar')
    }

    try {
      // @ts-ignore
      res = await job(() => foo.fullname(), { ctx })
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toEqual(ctx.foo.fullname())
  })
})
