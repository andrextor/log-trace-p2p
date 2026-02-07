import type { NormalizedLogData } from "../../../types"
import type { LogParserStrategy } from "../../LogParserStrategy"

export class CheckoutLocalParser implements LogParserStrategy {
  parse(line: string): NormalizedLogData | null {
    // Regex específica para logs locales de Checkout
    const regex = /^\[(.*?)\]\s+\w+\.(\w+):\s+(.*)$/
    const match = line.match(regex)

    if (!match) return null

    const [_, timestamp, level, contentRaw] = match
    let message = contentRaw.trim()
    let context: Record<string, any> = {}

    // Lógica multi-json (Payload + TenantId)
    const foundObjects: any[] = []
    let firstJsonIndex = -1
    let bracketCount = 0
    let startIndex = -1

    for (let i = 0; i < contentRaw.length; i++) {
      const char = contentRaw[i]
      if (char === "{") {
        if (bracketCount === 0) startIndex = i
        bracketCount++
      } else if (char === "}") {
        bracketCount--
        if (bracketCount === 0 && startIndex !== -1) {
          const candidate = contentRaw.substring(startIndex, i + 1)
          try {
            const parsed = JSON.parse(candidate)
            foundObjects.push(parsed)
            if (firstJsonIndex === -1) firstJsonIndex = startIndex
          } catch (e) {
            /* Ignore */
          }
          startIndex = -1
        }
      }
      if (bracketCount < 0) bracketCount = 0
    }

    if (foundObjects.length > 0) {
      context = Object.assign({}, ...foundObjects)
      message = contentRaw.substring(0, firstJsonIndex).trim()
    }

    // Fallbacks de títulos específicos de Checkout
    if (!message && context) {
      if (context.action_method) message = `Action: ${context.action_method}`
      else if (context.type) message = `Event: ${context.type}`
      else message = "Checkout Log Details"
    }

    return {
      timestamp,
      level: level.toUpperCase(),
      message: message || "Log Local",
      context,
      sourceType: "LARAVEL_LOCAL",
    }
  }
}
