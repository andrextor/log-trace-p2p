import type { LogEvent, LogLevel, LogCategory } from "../../types"
import type { LogMapper } from "../BaseMapper"
import {
  buildEventId,
  extractTimestamp,
  normalizePath,
  extractHttpFromMessage,
} from "../mapperUtils"
import { ACTION_MAP } from "./CheckoutConfigMap"

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

    // 1. Identificar acción (prioridad a subType)
    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    // 2. Mensaje de display
    let displayMessage = data.message ?? "Sin mensaje"

    if (knownAction) {
      displayMessage = knownAction.message

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

    // 4. Extraer info HTTP desde el message (cuando no viene en context)
    const httpInfo = extractHttpFromMessage(data.message ?? "")

    // 5. Resolver método y URL normalizada
    const method =
      ctx.request?.method ??
      httpInfo.method ??
      this.resolveMethod(ctx, action, subType)

    const url = ctx.request?.url
      ? normalizePath(ctx.request.url)
      : ctx.response?.url
      ? normalizePath(ctx.response.url)
      : ctx.notification_url
      ? normalizePath(ctx.notification_url)
      : httpInfo.path ?? ""

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
        method,
        url,
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
      m.includes("[gw_lib] http req")
    )
      return "HTTP_REQ_OUT"

    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"
    if (
      m.includes("update") ||
      m.includes("db") ||
      m.includes("save") ||
      m.includes("resolving") ||
      m.includes("last_resolve_data") ||
      m.includes("transaction query by direct service") ||
      m.includes("define session trace") ||
      m.includes("updatesessionstateaction")
    )
      return "DB_OP"

    return "BACKEND_LOG"
  }
}
