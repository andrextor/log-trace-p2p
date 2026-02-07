import { APP_TYPES, type NormalizedLogData, type AnalyzerType } from "../types"
import type { LogParserStrategy } from "./LogParserStrategy"

// Importamos estrategias de CHECKOUT
import { CheckoutLocalParser } from "./strategies/checkout/CheckoutLocalParser"
import { CheckoutAwsCsvParser } from "./strategies/checkout/CheckoutAwsCsvParser"
import { CheckoutInsightsParser } from "./strategies/checkout/CheckoutInsightsParser"

// Importamos estrategias de REST
import { RestNewRelicParser } from "./strategies/rest/RestNewRelicParser"

/**
 * Interfaz extendida para que el Store sepa qué App se detectó exactamente.
 * Vital para elegir el Mapper correcto en tiempo real.
 */
export interface IngestedResult extends NormalizedLogData {
  inferredApp: AnalyzerType
}

export class LogIngestor {
  /**
   * Procesa la entrada y detecta automáticamente la App.
   * Prioriza el tipo activo, pero es capaz de "adivinar" si el log es de otra aplicación.
   */
  static parse(
    line: string,
    activeType: AnalyzerType | "ALL"
  ): IngestedResult[] {
    // 1. DESEMPAQUETADO: Convertimos la entrada en unidades lógicas
    const units = this.splitLogicalUnits(line)
    const results: IngestedResult[] = []

    // 2. PRIORIDAD DE DETECCIÓN:
    // Si el usuario está en una pestaña, probamos esa primero.
    // Si está en 'ALL', probamos REST primero (por ser JSON es más certero) y luego Checkout.
    const allApps = Object.values(APP_TYPES) as AnalyzerType[]
    const appPriority =
      activeType === "ALL"
        ? [APP_TYPES.REST, APP_TYPES.CHECKOUT]
        : [
            activeType as AnalyzerType,
            ...allApps.filter((t) => t !== activeType),
          ]

    for (const unit of units) {
      let unitParsed = false

      // 3. DETECCIÓN DINÁMICA: Probamos estrategias hasta que una funcione
      for (const appType of appPriority) {
        const strategies = this.getStrategiesForType(appType)

        for (const strategy of strategies) {
          const parsed = strategy.parse(unit)

          if (parsed) {
            // 4. ETIQUETADO: Guardamos qué App detectamos
            results.push({
              ...parsed,
              inferredApp: appType,
            })
            unitParsed = true
            break
          }
        }
        if (unitParsed) break // Si ya detectamos la App para este log, saltamos al siguiente
      }
    }

    return results
  }

  /**
   * Identifica si el rastro es un Array JSON (New Relic) y lo desglosa en objetos.
   * Esto evita que el sistema vea "una sola línea" cuando hay muchos eventos dentro.
   */
  private static splitLogicalUnits(line: string): string[] {
    const trimmed = line.trim()
    if (!trimmed) return []

    // Manejo de Arrays JSON
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const arr = JSON.parse(trimmed)
        if (Array.isArray(arr)) {
          // Convertimos cada rastro del array en un string JSON individual
          //
          return arr.map((obj) => JSON.stringify(obj))
        }
      } catch {
        // Si el JSON es inválido, lo tratamos como rastro plano
        return [line]
      }
    }

    return [line]
  }

  /**
   * Catálogo de estrategias de parseo por cada Aplicación.
   */
  private static getStrategiesForType(type: AnalyzerType): LogParserStrategy[] {
    switch (type) {
      case APP_TYPES.CHECKOUT:
        return [
          new CheckoutInsightsParser(), // 1. Formato JSON específico
          new CheckoutAwsCsvParser(), // 2. Export de AWS
          new CheckoutLocalParser(), // 3. Texto plano / Laravel
        ]
      case APP_TYPES.REST:
        return [
          new RestNewRelicParser(), // Parser para logs de Interdin en New Relic
        ]
      default:
        return [new CheckoutLocalParser()]
    }
  }
}
