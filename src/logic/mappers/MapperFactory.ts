import { APP_TYPES, type AnalyzerType } from "../types"
import type { LogMapper } from "./mappers/BaseMapper"
import { CheckoutMapper } from "./checkout/CheckoutMapper"

// import { RestMapper } from "./mappers/rest/RestMapper"; // <--- Descomenta cuando exista

export class MapperFactory {
  /**
   * Devuelve la instancia del Mapper correspondiente al tipo de análisis seleccionado.
   */
  static getMapper(type: AnalyzerType): LogMapper {
    switch (type) {
      case APP_TYPES.CHECKOUT:
        return new CheckoutMapper()

      case APP_TYPES.MICROSITIOS:
        console.warn(
          "⚠️ Mapper Micrositios en construcción. Usando Checkout por defecto."
        )
        return new CheckoutMapper() // Fallback temporal

      case APP_TYPES.REST:
        // return new RestMapper();
        console.warn(
          "⚠️ Mapper REST API en construcción. Usando Checkout por defecto."
        )
        return new CheckoutMapper() // Fallback temporal

      default:
        console.error(
          `Tipo de analizador desconocido: ${type}. Usando Checkout.`
        )
        return new CheckoutMapper()
    }
  }
}
