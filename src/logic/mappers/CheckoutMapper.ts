import type { LogEvent, LogLevel } from "../types"
import type { LogMapper } from "./BaseMapper";
import { buildEventId, extractTimestamp } from "./mapperUtils"

export class CheckoutMapper implements LogMapper {
  canHandle(data: any): boolean {
    return !!(
      data.context?.session_id || data.TENANT_DOMAIN?.includes("checkout")
    )
  }

  map(data: any, rawLine: string, index: number): LogEvent {
    const ctx = data.context ?? {}
    const subType = data.type ?? ctx.type ?? null

    let displayMessage = data.message ?? "Sin mensaje"
    if (displayMessage === "placetopay_event" && subType) {
      displayMessage = subType
    }

    const isFront = data.channel === "frontend" || ctx.browser

    return {
      id: buildEventId(ctx, index),
      timestamp: extractTimestamp(data, rawLine),
      level: (data.level_name as LogLevel) ?? "INFO",
      message: displayMessage,
      // Usamos la lógica interna de esta clase
      category: this.inferCheckoutCategory(displayMessage, subType),
      details: {
        method: ctx.request?.method ?? ctx.action_method ?? "",
        url:
          ctx.request?.url ?? ctx.response?.url ?? ctx.notification_url ?? "",
        statusCode: ctx.response?.status_code ?? data.level ?? null,
        sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
        transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
        subType,
        source: isFront ? "FRONTEND" : "BACKEND",
      },
      context: data,
      rawStream: rawLine.slice(0, 80),
    }
  }

  private inferCheckoutCategory(
    msg: string,
    subType: string | null
  ): LogEvent["category"] {
    const m = msg.toLowerCase()
    const s = (subType ?? "").toLowerCase()

    if (m.includes("notify") || s.includes("notification"))
      return "NOTIFICATION"
    if (m.includes("http req") || m.includes("calling")) return "HTTP_REQ"
    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"
    if (m.includes("update") || m.includes("db") || m.includes("transaction"))
      return "DB_OP"
    if (m.includes("trace") || m.includes("event")) return "BACKEND_LOG"

    return "GENERIC"
  }
}
