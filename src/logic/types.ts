export interface NormalizedLogData {
  timestamp: string
  level: string
  message: string
  context: Record<string, any>
  sourceType?: "AWS_CSV" | "LARAVEL_LOCAL" | "UNKNOWN"
}

export type AnalyzerType = "checkout" | "micrositios" | "rest"

export const ANALYZER_NAMES: Record<AnalyzerType, string> = {
  checkout: "Checkout (PlacetoPay)",
  micrositios: "Micrositios",
  rest: "API REST Core",
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

// Aquí agregué las categorías que faltaban según tu archivo original
export type LogCategory =
  | "HTTP_REQ_OUT" // Peticiones salientes (Guzzle)
  | "HTTP_REQ_IN" // Peticiones entrantes (Controladores) <--- NUEVO
  | "HTTP_RES" // Respuestas
  | "DB_OP" // Operaciones BD
  | "NOTIFICATION" // Notificación al comercio
  | "RETURN_NOTIFICATION" // Notificación de retorno <--- NUEVO
  | "BROWSER_LOAD" // Carga en frontend
  | "USER_ACTION" // Click del usuario
  | "BACKEND_LOG" // Traza interna
  | "ERROR"
  | "GENERIC"

export interface LogEvent {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  category: LogCategory
  details: {
    method?: string
    url?: string
    statusCode?: number | string | null
    duration?: string
    sessionId?: string | number
    transactionId?: string | number
    subType?: string | null
    source?: string | null
  }
  context: any
  rawStream?: string
}
