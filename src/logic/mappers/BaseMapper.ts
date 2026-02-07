import type { LogEvent, NormalizedLogData } from "../types"

/**
 * Define la identidad visual del filtro activo (Badge superior)
 */
export interface FilterIdentity {
  label: string
  colorClass: "orange" | "indigo"
}

export interface LogMapper {
  /**
   * Pregunta: "¿Puedo leer esta data?"
   * Recibe el objeto normalizado para verificar si pertenece a su dominio (Checkout, Rest, etc.)
   */
  canHandle(data: NormalizedLogData): boolean

  /**
   * Acción: Convierte la data normalizada en un evento estructurado para la UI.
   *
   */
  map(data: NormalizedLogData, rawLine: string, index: number): LogEvent

  /**
   * Determina si un evento coincide con el ID que se quiere resaltar (SessionId, AWSId, etc.)
   */
  isMatch(event: LogEvent, targetId: string): boolean

  /**
   * Retorna metadatos sobre qué tipo de ID se está filtrando para la interfaz
   */
  getFilterIdentity(event: LogEvent, targetId: string): FilterIdentity
}
