import type { LogMapper } from "./BaseMapper"
import type { AnalyzerType } from "../types"
import { CheckoutMapper } from "./checkout/CheckoutMapper"

// Aquí importarás los futuros:
// import { MicrositiosMapper } from "./mappers/micrositios/MicrositiosMapper";
// import { RestApiMapper } from "./mappers/rest/RestApiMapper";

export class MapperFactory {
  /**
   * Recibe el tipo de analizador (string) y devuelve la Instancia de la clase
   * encargada de procesar esa lógica.
   */
  static getMapper(type: AnalyzerType): LogMapper {
    switch (type) {
      case "checkout":
        return new CheckoutMapper()

      case "micrositios":
        // return new MicrositiosMapper();
        console.warn(
          "⚠️ Mapper Micrositios en construcción. Usando Checkout por defecto."
        )
        return new CheckoutMapper()

      case "rest":
        // return new RestApiMapper();
        console.warn(
          "⚠️ Mapper REST API en construcción. Usando Checkout por defecto."
        )
        return new CheckoutMapper()

      default:
        // Fallback de seguridad
        return new CheckoutMapper()
    }
  }
}
