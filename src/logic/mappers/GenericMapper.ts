
import type { LogEvent, LogLevel } from "../types"
import type { LogMapper } from "./BaseMapper"
import { buildEventId, extractTimestamp } from "./mapperUtils"

export class GenericMapper implements LogMapper {
  canHandle(_data: any): boolean {
    return true
  }

  map(data: any, rawLine: string, index: number): LogEvent {
    const ctx = data.context ?? {}
    const message = data.message || "Generic Log"

    return {
      id: buildEventId(ctx, index),
      timestamp: extractTimestamp(data, rawLine),
      level: (data.level_name as LogLevel) ?? "INFO",
      message: message,
      // Lógica local simple para el genérico
      category: this.inferBasicCategory(message),
      details: {
        method: ctx.request?.method ?? "",
        url: ctx.request?.url ?? "",
        statusCode: ctx.response?.status_code ?? null,
        sessionId: ctx.session_id ?? "",
        transactionId: ctx.transaction_id ?? "",
        source: "BACKEND",
      },
      context: data,
      rawStream: rawLine.slice(0, 80),
    }
  }

  private inferBasicCategory(msg: string): LogEvent["category"] {
    const m = msg.toLowerCase()
    if (m.includes("http")) return "HTTP_REQ"
    if (m.includes("db") || m.includes("sql")) return "DB_OP"
    return "GENERIC"
  }
}
