import { CheckoutMapper } from "./mappers/checkout/CheckoutMapper"
import { GenericMapper } from "./mappers/GenericMapper"
import type { LogEvent } from "./types"
import type { AnalyzerType } from "../store/logStore"

// Instancias de mappers especializados
const checkoutMapper = new CheckoutMapper()
const genericMapper = new GenericMapper()

// Registro de estrategias por tipo de analizador
const ANALYZER_STRATEGIES: Record<AnalyzerType, any> = {
  checkout: checkoutMapper,
  rest: genericMapper, // Reemplazar por RestMapper cuando exista
  micrositios: genericMapper, // Reemplazar por MicrositiosMapper cuando exista
}

/**
 * Procesa el string de entrada y lo convierte en eventos estructurados.
 * @param raw - Contenido bruto del log
 * @param analyzerType - Estrategia seleccionada por el usuario
 */
export function parseP2PLogs(
  raw: string,
  analyzerType: AnalyzerType = "checkout"
) {
  if (!raw) return { events: [], errors: [] }

  const rows = sanitizeRaw(raw)
  const events: LogEvent[] = []
  const errors: any[] = []

  // Obtenemos el mapper preferido según la UI
  const preferredMapper = ANALYZER_STRATEGIES[analyzerType] || genericMapper

  rows.forEach((line, index) => {
    try {
      const jsonStr = extractJson(line)
      if (!jsonStr) return

      const data = JSON.parse(jsonStr)

      /**
       * Lógica de Decisión de Mapeo:
       * 1. ¿El mapper preferido (seleccionado en el select) puede manejarlo?
       * 2. ¿El checkoutMapper (nuestro mapper más fuerte) puede manejarlo?
       * 3. Fallback al genérico.
       */
      let mapper = genericMapper

      if (preferredMapper.canHandle(data)) {
        mapper = preferredMapper
      } else if (checkoutMapper.canHandle(data)) {
        mapper = checkoutMapper
      }

      events.push(mapper.map(data, line, index))
    } catch (err) {
      errors.push({
        line: index + 1,
        reason: "JSON inválido o malformado",
        content: line.slice(0, 80),
      })
    }
  })

  // Ordenamiento cronológico garantizado
  const sortedEvents = events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return { events: sortedEvents, errors }
}

/**
 * Limpia el rastro eliminando caracteres invisibles, líneas vacías
 * y cabeceras basura de exportaciones CSV/Excel.
 */
function sanitizeRaw(raw: string): string[] {
  return raw
    .trim()
    .replace(/^\uFEFF/, "") // Elimina el BOM de archivos UTF-8
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      // Filtramos líneas vacías, comillas sueltas o cabeceras de tablas
      return (
        l &&
        l !== '"' &&
        !l.startsWith("@timestamp") &&
        !l.includes("fields.message")
      )
    })
}

/**
 * Extrae el objeto JSON de una línea, incluso si tiene texto antes o después.
 * Maneja el escape de dobles comillas (Common en logs de AWS/Cloudwatch).
 */
function extractJson(line: string): string | null {
  const start = line.indexOf("{")
  const end = line.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) return null

  return line.substring(start, end + 1).replace(/""/g, '"')
}
