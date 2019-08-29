import { Worker } from 'worker_threads'

export interface Config<T = {}, U = {}, C = {}> {
  ctx?: T
  data?: U,
  props?: C
}

export interface Task {
  handler: Function
  config: Config
  resolve: Function
  reject: Function
}

export interface WorkerWrapper {
  status: string
  worker: Worker,
  props: any
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
