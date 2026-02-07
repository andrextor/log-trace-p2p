export const APP_TYPES = {
  CHECKOUT: "checkout",
  MICROSITIOS: "micrositios",
  REST: "rest",
} as const

// Derivamos el tipo automáticamente: "checkout" | "micrositios" | "rest"
export type AnalyzerType = (typeof APP_TYPES)[keyof typeof APP_TYPES]

export const ANALYZER_NAMES: Record<AnalyzerType, string> = {
  [APP_TYPES.CHECKOUT]: "Checkout",
  [APP_TYPES.MICROSITIOS]: "Micrositios",
  [APP_TYPES.REST]: "API REST Core",
}

// --- 2. CONFIGURACIÓN DE LOGS ---

export interface NormalizedLogData {
  timestamp: string
  level: string
  message: string
  context: Record<string, any>
  sourceType?: "AWS_CSV" | "LARAVEL_LOCAL" | "UNKNOWN"
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export type LogCategory =
  | "HTTP_REQ_OUT" // Peticiones salientes (Guzzle)
  | "HTTP_REQ_IN" // Peticiones entrantes (Controladores)
  | "HTTP_RES" // Respuestas
  | "DB_OP" // Operaciones BD
  | "NOTIFICATION" // Notificación al comercio
  | "RETURN_NOTIFICATION" // Notificación de retorno
  | "BROWSER_LOAD" // Carga en frontend
  | "USER_ACTION" // Click del usuario
  | "BACKEND_LOG" // Traza interna
  | "ERROR" // Fallos de sistema (Rojo)
  | "GENERIC" // Logs generales

// --- 3. DETALLES ESPECÍFICOS (Polimorfismo) ---

/**
 * Detalles exclusivos para CHECKOUT
 */
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

/**
 * Detalles exclusivos para API REST (Futuro)
 */
export interface RestDetails {
  method: string
  route: string
  clientIp?: string
  headers?: Record<string, string>
  payload?: any
}

/**
 * Detalles exclusivos para MICROSITIOS (Futuro)
 */
export interface MicrositiosDetails {
  siteId: string | number
  formName?: string
}

/**
 * Unión de todos los posibles detalles
 */
export type AppLogDetails = CheckoutDetails | RestDetails | MicrositiosDetails

// --- 4. EVENTO FINAL (UI) ---

export interface LogEvent {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  category: LogCategory
  appType: AnalyzerType
  details: AppLogDetails

  context: any
  rawStream?: string
}
