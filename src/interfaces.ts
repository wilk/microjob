export interface Config {
  ctx: any
  data: any
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

export interface WorkerResponse {
  error: {
    message: string,
    stack: string
  }
  data: any
}
