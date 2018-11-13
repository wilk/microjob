import { EventEmitter } from 'events'

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

// mock of Worker thread
export class WorkerMock extends EventEmitter {
  constructor(private file: string) {
    super()

    // interpret worker.js
    require(file)

    // emit an error when something is sent from the worker
    parentPort.on('fake message', () =>
      this.emit('error', new Error(FAKE_ERROR_MESSAGE))
    )

    setTimeout(() => this.emit('error', new Error(FAKE_ERROR_MESSAGE)), 250)
  }

  // parrot the worker
  postMessage(message: string): void {
    parentPort.emit('message', message)
  }

  terminate(cb: Function): void {
    cb()
  }
}

// mock worker_threads
const mock = jest.mock('worker_threads', () => ({
  Worker: WorkerMock,
  parentPort
}))

import { start } from '../src/job'

// restore original worker_threads module
afterAll(() => mock.restoreAllMocks())

describe('Broken Job Testing', () => {
  it('should not start the worker pool with broken workers', async () => {
    let error

    try {
      await start()
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.message).toBe(FAKE_ERROR_MESSAGE)
  })
})
