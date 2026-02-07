import type { LogCategory } from "../../types"

export interface RestActionDetail {
  message: string
  category: LogCategory
  source: "BACKEND"
}

// Mapeo basado en el campo 'operation' del JSON interno de la SDK
export const REST_ACTION_MAP: Record<string, RestActionDetail> = {
  creditType: {
    message: "Consulta de Cuotas y Formas de Pago",
    category: "HTTP_REQ_OUT",
    source: "BACKEND",
  },
  createOTP: {
    message: "Generación de Segundo Factor (OTP)",
    category: "NOTIFICATION",
    source: "BACKEND",
  },
  // Agrega más operaciones según aparezcan (ej: 'authorize', 'reverse')
}

export const REST_CATEGORY_STYLES: Record<
  string,
  { label: string; classes: string }
> = {
  INTERDIN: {
    label: "SDK Interdin",
    classes:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  GENERIC_REST: {
    label: "Rest API",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-indigo-500/5 dark:text-indigo-400/80 dark:border-indigo-500/10",
  },
}
