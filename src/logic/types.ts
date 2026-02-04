export type LogLevel = "INFO" | "ERROR" | "WARNING" | "DEBUG"

export interface LogEvent {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  category:
    | "HTTP_REQ"
    | "HTTP_RES"
    | "DB_OP"
    | "NOTIFICATION"
    | "EVENT"
    | "GENERIC"
  details: {
    method?: string
    url?: string
    statusCode?: number
    duration?: string
    sessionId?: string | number
    transactionId?: string | number
  }
  context: any
  rawStream: string
}
