import { Config } from './interfaces'

export function job(handler: Function, config?: Config): Promise<any>
export function stop(): void
