import type { LogEvent, LogLevel } from "./types"

export interface ParseResult {
  events: LogEvent[]
  errors: { line: number; reason: string; content: string }[]
}

export function parseP2PLogs(raw: string): ParseResult {
  if (!raw) return { events: [], errors: [] }

  const rows = sanitizeRaw(raw)
  const events: LogEvent[] = []
  const errors: ParseResult["errors"] = []

  rows.forEach((line, index) => {
    try {
      const json = extractJson(line)
      if (!json) return

      const data = JSON.parse(json)
      const event = mapToEvent(data, line, index)

      events.push(event)
    } catch (err) {
      errors.push({
        line: index + 1,
        reason: err instanceof Error ? err.message : "Unknown parsing error",
        content: line.slice(0, 80) + "...",
      })
    }
  })

  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return { events, errors }
}

function sanitizeRaw(raw: string): string[] {
  return raw
    .trim()
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && l !== '"' && !l.includes("@timestamp,@message"))
}

function extractJson(line: string): string | null {
  const start = line.indexOf("{")
  const end = line.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  return line.substring(start, end + 1).replace(/""/g, '"')
}

/**
 * Mapea la data JSON al objeto de evento de la interfaz
 */
function mapToEvent(data: any, rawLine: string, index: number): LogEvent {
  const ctx = data.context ?? {}

  // Extraemos el subtipo (ej: checkout.session.created)
  const subType = data.type ?? ctx.type ?? null
  let displayMessage = data.message ?? "No message"

  // Mejoramos mensajes genéricos de placetopay_event
  if (displayMessage === "placetopay_event" && subType) {
    displayMessage = `${subType}`
  }

  return {
    id: buildEventId(ctx, index),
    timestamp: extractTimestamp(data, rawLine),
    level: (data.level_name as LogLevel) ?? "INFO",
    message: displayMessage,
    category: inferCategory(data.message ?? ""),
    details: {
      method: ctx.request?.method ?? ctx.action_method ?? "",
      url: ctx.request?.url ?? ctx.response?.url ?? ctx.notification_url ?? "",
      statusCode: ctx.response?.status_code ?? data.level ?? null,
      sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
      transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
      subType, // Añadimos el subtipo a los detalles
    },
    // Guardamos 'data' completo en lugar de solo 'ctx' para no perder campos raíz
    context: data,
    rawStream: rawLine.slice(0, 80),
  }
}

function buildEventId(ctx: any, index: number): string {
  return (
    ctx.aws_request_id ??
    ctx.transaction_id ??
    ctx.session_id ??
    `line-${index}-${Date.now()}`
  )
}

function extractTimestamp(data: any, line: string): string {
  if (data.datetime) return data.datetime
  return line.substring(0, 23).replace(/"/g, "")
}

function inferCategory(msg: string): LogEvent["category"] {
  const m = msg.toLowerCase()
  if (m.includes("http req") || m.includes("[gw_lib] http req"))
    return "HTTP_REQ"
  if (m.includes("http res") || m.includes("[gw_lib] http res"))
    return "HTTP_RES"
  if (m.includes("notify") || m.includes("notification")) return "NOTIFICATION"
  if (m.includes("update") || m.includes("updating")) return "DB_OP"
  if (m.includes("placetopay_event") || m.includes("executed event"))
    return "BACKEND_LOG"
  return "GENERIC"
}
