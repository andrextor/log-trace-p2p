// --- 1. IDENTIFICADORES DE APLICACIÓN ---

export const APP_TYPES = {
  CHECKOUT: "checkout",
  MICROSITIOS: "micrositios",
  REST: "rest",
} as const

export type AnalyzerType = (typeof APP_TYPES)[keyof typeof APP_TYPES]

export const ANALYZER_NAMES: Record<AnalyzerType, string> = {
  [APP_TYPES.CHECKOUT]: "Checkout",
  [APP_TYPES.MICROSITIOS]: "Micrositios",
  [APP_TYPES.REST]: "API REST Core",
}

// --- 2. ESTRUCTURAS DE DATOS CRUDA (Parsers) ---

export interface NormalizedLogData {
  timestamp: string
  level: string
  message: string
  context: Record<string, any>
  // Añadimos NEW_RELIC_JSON para el nuevo parser de REST
  sourceType?: "AWS_CSV" | "LARAVEL_LOCAL" | "NEW_RELIC_JSON" | "UNKNOWN"
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

/**
 * Categorías visuales para el Dashboard
 */
export type LogCategory =
  | "HTTP_REQ_OUT" // Peticiones salientes (Guzzle/SDKs)
  | "HTTP_REQ_IN" // Peticiones entrantes
  | "HTTP_RES" // Respuestas HTTP
  | "DB_OP" // Operaciones de Base de Datos
  | "NOTIFICATION" // Notificaciones o OTPs
  | "RETURN_NOTIFICATION" // Flujos de retorno
  | "BROWSER_LOAD" // Eventos de carga SPA
  | "USER_ACTION" // Interacciones del usuario
  | "BACKEND_LOG" // Trazas internas de lógica
  | "ERROR" // Fallos críticos
  | "GENERIC" // Otros

// --- 3. POLIMORFISMO DE DETALLES (App-Specific) ---

export interface CheckoutDetails {
  method?: string
  url?: string
  statusCode?: number | string | null
  duration?: string
  sessionId?: string | number
  transactionId?: string | number
  subType?: string | null
  source?: string | null
  aws_request_id?: string | null
  payload?: any
}

export interface RestDetails {
  provider: string
  operation: string
  action: string
  method: string
  endpoint: string
  statusCode?: number | string
  awsRequestId?: string | null
  payload: any
  exception?: any
  source: "BACKEND"
}

export interface MicrositiosDetails {
  siteId: string | number
  formName?: string
}

/**
 * Tipo discriminado para los detalles
 */
export type AppLogDetails = CheckoutDetails | RestDetails

// --- 4. MODELO DE EVENTO FINAL (UI) ---

export interface LogEvent {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  category: LogCategory
  appType: AnalyzerType // Usamos la constante aquí
  details: AppLogDetails
  context: any
  rawStream?: string
}
