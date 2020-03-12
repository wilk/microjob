import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())

describe('Job Context Testing', () => {
  it('should execute a an inline job with custom context', async () => {
    let error
    let res

    class Foo { }

    const ctx = {
      hello: 'world',
      fun: () => console.log('hello world!'),
      numb: 10,
      bool: true,
      obj: {
        nested: 'deep'
      },
      arr: [10, 20, 'meh'],
      myClass: Foo,
      myInstance: new Foo()
    }

    // foreignKey is used to increase the test coverage
    // @ts-ignore
    ctx.__proto__.foreignKey = 'test'

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
      fun: function () {
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

  it('should not allow arbitrary code execution in strings', async () => {
    let error
    let res

    const evilString = '\';parentPort.postMessage({data: \"Hippity Hoppity, this program is now my property\"});\''

    const ctx = { evilString }

    try {
      // @ts-ignore
      res = await job(() => evilString, { ctx })
    } catch (err) {
      error = err
    }

    expect(error).toBeUndefined()
    expect(res).toEqual(evilString)
  })
})
