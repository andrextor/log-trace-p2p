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
  sourceType?: "AWS_CSV" | "LARAVEL_LOCAL" | "NEW_RELIC_JSON" | "UNKNOWN"
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export type LogCategory =
  | "HTTP_REQ_OUT"
  | "HTTP_REQ_IN"
  | "HTTP_RES"
  | "DB_OP"
  | "NOTIFICATION"
  | "RETURN_NOTIFICATION"
  | "BROWSER_LOAD"
  | "USER_ACTION"
  | "BACKEND_LOG"
  | "APPLICATION_LOG" // Añadido para diferenciar logs de Laravel
  | "ERROR"
  | "PAYMENT"
  | "GENERIC"

// --- 3. POLIMORFISMO DE DETALLES (App-Specific) ---

/**
 * Propiedades que todos los detalles DEBEN compartir para que la UI
 * principal pueda leerlas sin errores de TypeScript.
 */
export interface BaseDetails {
  method?: string | null
  endpoint?: string | null // Unificamos URL/Endpoint aquí
  statusCode?: number | string | null
  payload?: any
  source?: string | null
}

export interface CheckoutDetails extends BaseDetails {
  url?: string // Mantenido por compatibilidad, pero el mapper debería llenar 'endpoint'
  duration?: string
  sessionId?: string | number
  transactionId?: string | number
  subType?: string | null
  aws_request_id?: string | null
  provider?: string | null
}

export interface RestDetails extends BaseDetails {
  provider: string
  operation: string
  action: string
  awsRequestId?: string | null
  exception?: any
  isLaravel?: boolean
}

export interface MicrositiosDetails extends BaseDetails {
  siteId: string | number
  formName?: string
  sessionId?: string | number
}

/**
 * Unión de tipos para los detalles.
 * Al heredar todos de BaseDetails, resolvemos el error de "Property does not exist".
 */
export type AppLogDetails = CheckoutDetails | RestDetails | MicrositiosDetails

// --- 4. MODELO DE EVENTO FINAL (UI) ---

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
