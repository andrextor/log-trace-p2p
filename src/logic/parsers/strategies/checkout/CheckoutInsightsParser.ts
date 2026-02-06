import type { NormalizedLogData } from "../../../types"
import type { LogParserStrategy } from "../../LogParserStrategy"

export class CheckoutInsightsParser implements LogParserStrategy {
  parse(line: string): NormalizedLogData | null {
    const regex = /^\s*(\d+)\s+([^\s]+)\s+(\{.*)$/
    const match = line.match(regex)
    if (!match) return null

    const [_, _id, timestamp, jsonRaw] = match

    try {
      const parsed = JSON.parse(jsonRaw)
      const finalTime = parsed.datetime || timestamp

      return {
        timestamp: finalTime,
        level: parsed.level_name || "INFO",
        message: parsed.message || "Log AWS Insights",
        context: parsed.context || parsed,
        sourceType: "AWS_CSV",
      }
    } catch (e) {
      return null
    }
  }
}
