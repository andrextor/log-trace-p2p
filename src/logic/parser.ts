import { CheckoutMapper } from "./mappers/checkout/CheckoutMapper"
import { GenericMapper } from "./mappers/GenericMapper"
import type { LogEvent } from "./types"
import type { AnalyzerType } from "../store/logStore"

const mappers = {
  checkout: new CheckoutMapper(),
  rest: new GenericMapper(),
  micrositios: new GenericMapper(),
}

const fallbackMapper = new GenericMapper()

export function parseP2PLogs(
  raw: string,
  analyzerType: AnalyzerType = "checkout"
) {
  if (!raw) return { events: [], errors: [] }

  const rows = sanitizeRaw(raw)
  const events: LogEvent[] = []
  const errors: any[] = []

  const primaryMapper = mappers[analyzerType] || mappers.checkout

  rows.forEach((line, index) => {
    try {
      const jsonStr = extractJson(line)
      if (!jsonStr) return
      const data = JSON.parse(jsonStr)

      // 1. Intentamos con el mapper seleccionado por el usuario
      const mapper = primaryMapper.canHandle(data)
        ? primaryMapper
        : fallbackMapper

      events.push(mapper.map(data, line, index))
    } catch (err) {
      errors.push({
        line: index + 1,
        reason: "Error de parseo JSON",
        content: line.slice(0, 80),
      })
    }
  })

  // Ordenar por fecha (ascendente)
  const sortedEvents = events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return { events: sortedEvents, errors }
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
