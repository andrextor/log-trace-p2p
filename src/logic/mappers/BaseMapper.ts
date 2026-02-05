import type { LogEvent } from "../types"

export interface LogMapper {
  canHandle(data: any): boolean
  map(data: any, rawLine: string, index: number): LogEvent
}
