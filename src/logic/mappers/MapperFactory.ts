import { APP_TYPES, type AnalyzerType } from "../types"
import type { LogMapper } from "./BaseMapper"

// Importaciones de los Mappers específicos
import { CheckoutMapper } from "./checkout/CheckoutMapper"
import { RestMapper } from "./rest/RestMapper"

export class MapperFactory {
  /**
   * Registro estático de instancias para reutilización y ahorro de memoria.
   */
  private static instances: Record<string, LogMapper> = {
    [APP_TYPES.CHECKOUT]: new CheckoutMapper(),
    [APP_TYPES.REST]: new RestMapper(),
  }

  /**
   * Devuelve la instancia del Mapper correspondiente al tipo de análisis seleccionado.
   * Si no existe, aplica lógica de fallback o error.
   */
  static getMapper(type: AnalyzerType): LogMapper {
    const mapper = this.instances[type]

    // 1. Caso Ideal: El mapper existe en el registro
    if (mapper) {
      return mapper
    }

    // 2. Fallback para Micrositios (Comparten lógica con Checkout por ahora)
    if (type === APP_TYPES.MICROSITIOS) {
      console.warn(
        "⚠️ Mapper Micrositios en construcción. Usando CheckoutMapper como fallback."
      )
      return this.instances[APP_TYPES.CHECKOUT]
    }

    // 3. Caso de Error: Tipo desconocido
    console.error(
      `❌ Tipo de analizador desconocido: "${type}". Devolviendo Checkout por seguridad.`
    )
    return this.instances[APP_TYPES.CHECKOUT]
  }
}
