import type { NormalizedLogData } from "../types"

export interface LogParserStrategy {
  /**
   * Intenta parsear una línea de texto.
   * Retorna null si el formato no coincide con esta estrategia.
   */
  parse(line: string): NormalizedLogData | null
}
