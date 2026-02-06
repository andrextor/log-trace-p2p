import type { LogEvent } from "./types"

export interface LogMapper {
  /**
   * Pregunta: "¿Puedo leer esta línea?"
   * Retorna true si el mapper reconoce el formato o el contenido.
   */
  canHandle(rawInput: any): boolean

  /**
   * Acción: Convierte la línea cruda en un evento bonito para el Timeline.
   */
  map(rawInput: any, rawLine: string, index: number): LogEvent
}
