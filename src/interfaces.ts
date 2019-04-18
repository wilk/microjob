export interface Config<T = {}, U = {}> {
  ctx?: T
  data?: U
}

export interface Task {
  handler: Function
  config: Config
  resolve: Function
  reject: Function
}

export interface WorkerWrapper {
  status: string
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
