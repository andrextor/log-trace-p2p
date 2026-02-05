import { CheckoutMapper } from "./mappers/CheckoutMapper"
import { GenericMapper } from "./mappers/GenericMapper"
import type { LogEvent } from "./types"

export interface ParseResult {
  events: LogEvent[]
  errors: { line: number; reason: string; content: string }[]
}

const registeredMappers = [new CheckoutMapper(), new GenericMapper()]

export function parseP2PLogs(raw: string): ParseResult {
  if (!raw) return { events: [], errors: [] }

  const rows = sanitizeRaw(raw)
  const events: LogEvent[] = []
  const errors: ParseResult["errors"] = []

  rows.forEach((line, index) => {
    try {
      const jsonStr = extractJson(line)
      if (!jsonStr) return

      const data = JSON.parse(jsonStr)

      const mapper =
        registeredMappers.find((m) => m.canHandle(data)) ||
        registeredMappers[registeredMappers.length - 1]

      events.push(mapper.map(data, line, index))
    } catch (err) {
      errors.push({
        line: index + 1,
        reason: err instanceof Error ? err.message : "Error de parseo",
        content: line.slice(0, 80),
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
