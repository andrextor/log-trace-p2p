import type { NormalizedLogData, AnalyzerType } from "../types"
import type { LogParserStrategy } from "./LogParserStrategy"

// Importamos estrategias de CHECKOUT
import { CheckoutLocalParser } from "./strategies/checkout/CheckoutLocalParser"
import { CheckoutAwsCsvParser } from "./strategies/checkout/CheckoutAwsCsvParser"
import { CheckoutInsightsParser } from "./strategies/checkout/CheckoutInsightsParser"

// Aquí importarás las futuras estrategias de REST y MICROSITIOS
// import { RestLocalParser } from "./strategies/rest/RestLocalParser";

export class LogIngestor {
  /**
   * Recibe la línea y el TIPO de analizador activo.
   * Solo prueba las estrategias configuradas para ese tipo.
   */
  static parse(
    rawLine: string,
    type: AnalyzerType = "checkout"
  ): NormalizedLogData | null {
    if (!rawLine || rawLine.trim().length < 5) return null

    // Seleccionamos las estrategias según la App activa
    const strategies = this.getStrategiesForType(type)

    for (const strategy of strategies) {
      const result = strategy.parse(rawLine)
      if (result) {
        return result
      }
    }

    return null
  }

  /**
   * Define qué parseadores usar para cada aplicación.
   */
  private static getStrategiesForType(type: AnalyzerType): LogParserStrategy[] {
    switch (type) {
      case "checkout":
        return [
          new CheckoutInsightsParser(), // 1. Insights (Más específico)
          new CheckoutAwsCsvParser(), // 2. CSV
          new CheckoutLocalParser(), // 3. Local (Más genérico)
        ]

      case "micrositios":
        return [
          // new MicrositiosLocalParser(),
          // new MicrositiosAwsParser(),
        ]

      case "rest":
        return [
          // new RestLocalParser(),
        ]

      default:
        // Por seguridad, devolvemos Checkout o vacío
        return [new CheckoutLocalParser()]
    }
  }
}
