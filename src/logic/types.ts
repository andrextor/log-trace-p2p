// src/logic/types.ts

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

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
    statusCode?: number | null
    duration?: string
    sessionId?: string | number
    transactionId?: string | number
    subType?: string | null
    source?: string | null
  }
  context: any
  rawStream?: string
}

