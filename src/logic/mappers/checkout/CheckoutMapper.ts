import type { LogEvent, LogLevel, LogCategory } from "../../types"
import type { LogMapper } from "../BaseMapper"
import { buildEventId, extractTimestamp } from "../mapperUtils"
import { ACTION_MAP } from "./checkoutConfig"

export class CheckoutMapper implements LogMapper {
  canHandle(data: any): boolean {
    const ctx = data.context ?? {}
    return !!(
      ctx.session_id ||
      ctx.data?.session_id ||
      data.TENANT_DOMAIN?.includes("checkout")
    )
  }

  map(data: any, rawLine: string, index: number): LogEvent {
    const ctx = data.context ?? {}
    const subType = data.type ?? ctx.type ?? null
    const action = ctx.action_method

    // 1. Identificar acción (Prioridad a subType de creación, luego action_method)
    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    // 2. Construcción de Mensaje dinámico
    let displayMessage = data.message ?? "Sin mensaje"
    if (knownAction) {
      displayMessage = knownAction.message
      // Plus: Si es procesamiento, mostramos el gateway (pse, card, etc)
      if (action === "process" && ctx.body?.gateway) {
        displayMessage += ` vía ${ctx.body.gateway.toUpperCase()}`
      }
    } else if (displayMessage === "placetopay_event" && subType) {
      displayMessage = `Evento: ${subType}`
    }

    // 3. Origen
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

  private resolveMethod(ctx: any, action: string, subType: string): string {
    if (ctx.request?.method) return ctx.request.method
    if (subType === "checkout.session.created") return "POST"
    if (action) return action.toUpperCase()
    return ""
  }

  private inferCheckoutCategory(
    msg: string,
    subType: string | null,
    ctx: any,
    forced?: LogCategory
  ): LogCategory {
    if (forced) return forced

    const m = msg.toLowerCase()
    const s = (subType ?? "").toLowerCase()

    if (s.includes("notification") || m.includes("notify"))
      return "NOTIFICATION"
    if (
      m.includes("http req") ||
      m.includes("[gw_lib] http req") ||
      m.includes("calling")
    )
      return "HTTP_REQ_OUT"
    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"
    if (m.includes("update") || m.includes("db") || m.includes("save"))
      return "DB_OP"

    return "BACKEND_LOG"
  }
}
