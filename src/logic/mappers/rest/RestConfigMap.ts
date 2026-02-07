import type { LogCategory } from "../../types"

export interface RestActionDetail {
  message: string
  category: LogCategory
  source: "BACKEND"
}

export const REST_ACTION_MAP: Record<string, RestActionDetail> = {
  // --- Operaciones de SDK / API ---
  creditType: {
    message: "Consulta de Bin y Cuotas",
    category: "HTTP_REQ_OUT",
    source: "BACKEND",
  },
  createOTP: {
    message: "Solicitud de Segundo Factor (OTP)",
    category: "NOTIFICATION",
    source: "BACKEND",
  },
  authorize: {
    message: "Autorización de Transacción",
    category: "PAYMENT",
    source: "BACKEND",
  },
  // --- Eventos de Laravel.log (Detección por palabra clave) ---
  "no bin information": {
    message: "Información de BIN no encontrada",
    category: "BACKEND_LOG",
    source: "BACKEND",
  },
  "Error resolving credit types": {
    message: "Fallo resolviendo tipos de crédito",
    category: "ERROR",
    source: "BACKEND",
  },
  "Sending SMS": {
    message: "Gestión de Mensajería SMS",
    category: "NOTIFICATION",
    source: "BACKEND",
  },
  "loading invoices": {
    message: "Procesamiento de Facturación",
    category: "BACKEND_LOG",
    source: "BACKEND",
  },
}

export const REST_CATEGORY_STYLES: Record<
  string,
  { label: string; classes: string }
> = {
  INTERDIN: {
    label: "Interdin SDK",
    classes:
      "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  LARAVEL: {
    label: "Framework",
    classes:
      "bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  },
  REST_CORE: {
    label: "API Core",
    classes:
      "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-400 dark:border-indigo-500/10",
  },
}
