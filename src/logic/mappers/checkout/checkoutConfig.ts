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
    message: "Vista iniciar sesión usuario",
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
}

export const CATEGORY_STYLES: Record<LogCategory, { label: string; classes: string }> =
  {
    USER_ACTION: {
      label: "acción del usuario",
      classes: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    BROWSER_LOAD: {
      label: "carga en el browser",
      classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    HTTP_REQ_IN: {
      label: "solicitud recibida api",
      classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    HTTP_REQ_OUT: {
      label: "Petición Rest Http",
      classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    HTTP_RES: {
      label: "Respuesta Rest http",
      classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    DB_OP: {
      label: "proceso backend / db",
      classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    NOTIFICATION: {
      label: "notificación al comercio",
      classes: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    BACKEND_LOG: {
      label: "registro traza backend",
      classes: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    RETURN_NOTIFICATION: {
      label: "notificación de retorno",
      classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    GENERIC: {
      label: "registro general",
      classes: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    },
  }
