import { Worker } from 'worker_threads'

export interface Config<T = {}, U = {}, V = {}> {
  ctx?: T
  data?: U
  shared?: V
}

export interface Task {
  handler: Function
  config: Config
  resolve: Function
  reject: Function
}

export type WorkerState = 'ready' | 'spawning' | 'busy' | 'off'

export interface WorkerWrapper {
  status: WorkerState
  worker: Worker
}

export interface WorkerResponse<T = {}> {
  error: {
    message: string,
    stack: string
  }
  data: T
}

export interface SetupConfig {
  maxWorkers?: number
}
