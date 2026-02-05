import type { LogEvent, LogLevel, LogCategory } from "../types"
import type { LogMapper } from "./BaseMapper"
import { buildEventId, extractTimestamp } from "./mapperUtils"

/**
 * Mapeo de acciones basado en el flujo de Checkout
 * Centralizamos aquí para evitar "Magic Strings" y lógica dispersa.
 */
const ACTION_MAP: Record<
  string,
  { message: string; category: LogCategory; source: "FRONTEND" | "BACKEND" }
> = {
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
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
  "checkout.session.created": {
    message: "Solicitud de creación de sesión: Inicialización de flujo de pago",
    category: "HTTP_REQ_IN",
    source: "BACKEND",
  },
}

export class CheckoutMapper implements LogMapper {
  canHandle(data: any): boolean {
    const ctx = data.context ?? {}
    const isCheckoutDomain = data.TENANT_DOMAIN?.includes("checkout")
    const hasSessionId = !!(ctx.session_id || ctx.data?.session_id)

    return isCheckoutDomain || hasSessionId
  }

  map(data: any, rawLine: string, index: number): LogEvent {
    const ctx = data.context ?? {}
    const subType = data.type ?? ctx.type ?? null
    const action = ctx.action_method

    // 1. Prioridad: Identificar si es un evento de creación de sesión o una acción conocida
    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    // 2. Construcción del Mensaje
    let displayMessage = data.message ?? "Sin mensaje"

    if (knownAction) {
      displayMessage = knownAction.message
    } else if (displayMessage === "placetopay_event" && subType) {
      displayMessage = `Evento: ${subType}`
    }

    // 3. Determinación del Origen (Prioriza el mapa, luego el canal, luego fallback)
    const source =
      knownAction?.source ??
      (data.channel === "frontend" ? "FRONTEND" : "BACKEND")

    return {
      id: buildEventId(ctx, index),
      timestamp: extractTimestamp(data, rawLine),
      level: (data.level_name as LogLevel) ?? "INFO",
      message: displayMessage,
      category: this.inferCheckoutCategory(
        displayMessage,
        subType,
        ctx,
        knownAction?.category
      ),
      details: {
        method: this.resolveMethod(ctx, action, subType),
        url:
          ctx.request?.url ?? ctx.response?.url ?? ctx.notification_url ?? "",
        statusCode: ctx.response?.status_code ?? data.level ?? null,
        sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
        transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
        subType,
        source,
      },
      context: data,
      rawStream: rawLine.slice(0, 80),
    }
  }

  /**
   * Resuelve el método HTTP o la naturaleza de la acción
   */
  private resolveMethod(ctx: any, action: string, subType: string): string {
    if (ctx.request?.method) return ctx.request.method
    if (subType === "checkout.session.created") return "POST"
    if (action) return "ACTION"
    return ""
  }

  private inferCheckoutCategory(
    msg: string,
    subType: string | null,
    ctx: any,
    forcedCategory?: LogCategory
  ): LogCategory {
    if (forcedCategory) return forcedCategory

    const m = msg.toLowerCase()
    const s = (subType ?? "").toLowerCase()

    // Lógica jerárquica de categorías
    if (s.includes("notification") || m.includes("notify"))
      return "NOTIFICATION"

    if (
      m.includes("http req") ||
      m.includes("[gw_lib] http req") ||
      m.includes("calling")
    ) {
      return "HTTP_REQ_OUT"
    }

    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"

    if (
      m.includes("update") ||
      m.includes("db") ||
      m.includes("save") ||
      m.includes("insert")
    ) {
      return "DB_OP"
    }

    return "BACKEND_LOG"
  }
}
