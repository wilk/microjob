import { EventEmitter } from 'events'
import os from 'os'

const MAX_THREADS = os.cpus().length
const FAKE_ERROR_MESSAGE = 'fake error'
let emittedMessages = 0

// mock of parentPort, so it can be used inside worker.js
class ParentPortMock extends EventEmitter {
  postMessage(message: string): void {
    // don't emit another error when the "error catch message" is sent again from postMessage
    if (emittedMessages === 0) {
      emittedMessages++
      this.emit('fake message', message)
    }
  }
}

const parentPort = new ParentPortMock()
let workersCounter = 0

// mock of Worker thread
class WorkerMock extends EventEmitter {
  constructor(private file: string) {
    super()
    workersCounter++

    // interpret worker.js
    require(file)

    // emit an error when something is sent from the worker
    parentPort.on('fake message', () => {
      this.emit('error', new Error(FAKE_ERROR_MESSAGE))
    })

    setTimeout(() => this.emit('online'), 250)
  }

  // parrot the worker
  postMessage(message: string): void {
    parentPort.emit('message', message)
  }

  async terminate(): Promise<void> { }
}

// mock worker_threads
const mock = jest.mock('worker_threads', () => ({
  Worker: WorkerMock,
  parentPort
}))

import { job, stop, start } from '../src/job'

beforeAll(async () => await start())
afterAll(async () => await stop())
// restore original worker_threads module
afterAll(() => mock.restoreAllMocks())

describe('Self-Healing Testing', () => {
  it('should resurrect a dead worker', async done => {
    let error
    let res

    try {
      res = await job(() => {
        let i = 0
        for (i = 0; i < 1000000; i++) { }

        return i
      })
    } catch (err) {
      error = err
    }

    setTimeout(() => {
      expect(res).toBeUndefined()
      expect(error).toBeDefined()
      expect(error.message).toBe(FAKE_ERROR_MESSAGE)
      // if a dead worker has been resurrected, then the workersCounter must be greater
      // than the MAX_THREADS const
      expect(workersCounter).toBe(MAX_THREADS + 1)

      done()
    }, 300)
  })
})
