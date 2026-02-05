// src/logic/parser.ts
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
        reason: err instanceof Error ? err.message : "Error de sintaxis JSON",
        content: line.slice(0, 80),
      })
    }
  })

  // Ordenamos para que la línea de tiempo sea ascendente
  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return { events, errors }
}

/* --- Helpers de Limpieza --- */

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

/* --- Lógica de Mapeo --- */

function mapToEvent(data: any, rawLine: string, index: number): LogEvent {
  const ctx = data.context ?? {}

  // Extraemos el subtipo (ej: checkout.session.created)
  const subType = data.type ?? ctx.type ?? null
  let displayMessage = data.message ?? "No message"

  // Si el mensaje es el genérico de P2P, usamos el subType como título principal
  if (displayMessage === "placetopay_event" && subType) {
    displayMessage = subType
  }

  return {
    id: buildEventId(ctx, index),
    timestamp: extractTimestamp(data, rawLine),
    level: (data.level_name as LogLevel) ?? "INFO",
    message: displayMessage,
    category: inferCategory(data.message ?? "", subType),
    details: {
      method: ctx.request?.method ?? ctx.action_method ?? "",
      url: ctx.request?.url ?? ctx.response?.url ?? ctx.notification_url ?? "",
      statusCode: ctx.response?.status_code ?? data.level ?? null,
      sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
      transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
      subType
    },
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

/**
 * Mapea el mensaje a las categorías que espera el LogCard
 */
function inferCategory(
  msg: string,
  subType: string | null
): LogEvent["category"] {
  const m = msg.toLowerCase()
  const s = (subType ?? "").toLowerCase()

  // Prioridad 1: Notificaciones
  if (
    m.includes("notify") ||
    m.includes("notification") ||
    s.includes("notification")
  ) {
    return "NOTIFICATION"
  }

  // Prioridad 2: Requests HTTP
  if (
    m.includes("http req") ||
    m.includes("[gw_lib] http req") ||
    m.includes("calling")
  ) {
    return "HTTP_REQ"
  }

  // Prioridad 3: Responses HTTP
  if (
    m.includes("http res") ||
    m.includes("[gw_lib] http res") ||
    m.includes("response")
  ) {
    return "HTTP_RES"
  }

  // Prioridad 4: Base de Datos u Operaciones de persistencia
  if (
    m.includes("update") ||
    m.includes("updating") ||
    m.includes("db") ||
    m.includes("save")
  ) {
    return "DB_OP"
  }

  if (
    m.includes("trace") ||
    m.includes("executed event") ||
    m.includes("placetopay_event") ||
    m.includes("executed action")
  ) {
    return "BACKEND_LOG"
  }

  return "GENERIC"
}
