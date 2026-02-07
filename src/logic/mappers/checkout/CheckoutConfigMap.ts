import type { LogCategory } from "../../types"

export interface ActionDetail {
  message: string
  category: LogCategory
  source: "FRONTEND" | "BACKEND"
}

export const ACTION_MAP: Record<string, ActionDetail> = {
  entry: {
    message: "Visualización de interfaz en el navegador (SPA)",
    category: "BROWSER_LOAD",
    source: "FRONTEND",
  },
  show: {
    message: "Sesión cargada correctamente en el SPA",
    category: "BROWSER_LOAD",
    source: "FRONTEND",
  },
  index: {
    message: "Vista metodos de pago",
    category: "BROWSER_LOAD",
    source: "FRONTEND",
  },
  state: {
    message: "Vista resultado sesión",
    category: "BROWSER_LOAD",
    source: "FRONTEND",
  },
  process: {
    message: "Acción del usuario: Procesar pago",
    category: "USER_ACTION",
    source: "FRONTEND",
  },
  transaction: {
    message: "Notificación de transacción: Actualización de estado de pago",
    category: "RETURN_NOTIFICATION",
    source: "BACKEND",
  },
  "checkout.session.created": {
    message: "Solicitud de creación de sesión: Inicialización de flujo de pago",
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
  sessionInformation: {
    message: "Solicitud información de sesión (Api Publica)",
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
  createSession: {
    message: "Creación de Sesión (API Backend)",
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
  // --- NUEVAS ACCIONES DETECTADAS ---
  "App\\Http\\Controllers\\Api\\V4\\BanksDataController": {
    message: "Consulta de lista de bancos",
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
}

/**
 * Configuración de Estilos Adaptativa
 * Usamos clases de Tailwind que reaccionan al modo .dark
 */
export const CATEGORY_STYLES: Record<
  LogCategory,
  { label: string; classes: string }
> = {
  USER_ACTION: {
    label: "acción del usuario",
    classes:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
  },
  BROWSER_LOAD: {
    label: "carga en el browser",
    classes:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
  },
  HTTP_REQ_IN: {
    label: "solicitud recibida api",
    classes:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  },
  HTTP_REQ_OUT: {
    label: "Petición Rest Http",
    classes:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
  },
  HTTP_RES: {
    label: "Respuesta Rest http",
    classes:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
  },
  DB_OP: {
    label: "proceso backend / db",
    classes:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20",
  },
  NOTIFICATION: {
    label: "notificación al comercio",
    classes:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  },
  BACKEND_LOG: {
    label: "registro traza backend",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-green-500/5 dark:text-green-400/80 dark:border-green-500/10",
  },
  // --- NUEVA CATEGORÍA PARA LARAVEL.LOG ---
  APPLICATION_LOG: {
    label: "log de aplicación",
    classes:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  },
  RETURN_NOTIFICATION: {
    label: "notificación de retorno",
    classes:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  ERROR: {
    label: "ERROR / FALLO",
    classes:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500/50",
  },
  GENERIC: {
    label: "registro general",
    classes:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
  },
}
