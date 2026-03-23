import { type LogEvent, APP_TYPES } from "../types"

export interface FilterIdentity {
  label: string
  colorClass: "indigo" | "orange"
}

export class LogUIHelper {
  /**
   * Coincidencia robusta para resaltar todo el rastro de una transacción o sesión.
   * Centraliza la lógica que antes estaba esparcida en los mappers.
   */
  static isMatch(event: LogEvent, targetId: string): boolean {
    const tId = String(targetId).toLowerCase()
    const ctx = event.context || {}
    const details = event.details as any // Use as any to smoothly support multiple detail types

    if (event.appType === APP_TYPES.CHECKOUT) {
      return (
        String(event.id).toLowerCase() === tId ||
        String(details?.sessionId).toLowerCase() === tId ||
        String(details?.transactionId).toLowerCase() === tId ||
        String(details?.awsRequestId).toLowerCase() === tId ||
        String(details?.aws_request_id).toLowerCase() === tId ||
        String(ctx?.aws_request_id).toLowerCase() === tId ||
        String(ctx?.payload?.session_id).toLowerCase() === tId
      )
    }

    if (event.appType === APP_TYPES.REST) {
      return (
        String(event.id).toLowerCase() === tId ||
        String(details?.awsRequestId).toLowerCase() === tId ||
        String(ctx?.awsRequestId).toLowerCase() === tId ||
        String(details?.payload?.id).toLowerCase() === tId ||
        String(ctx?.payload?.id).toLowerCase() === tId ||
        String(ctx?.id).toLowerCase() === tId // Para JsonInterdin
      )
    }

    // Fallback genérico
    return String(event.id).toLowerCase() === tId
  }

  /**
   * Identifica cómo debe etiquetarse visualmente la coincidencia en el Timeline.
   */
  static getFilterIdentity(event: LogEvent, targetId: string): FilterIdentity {
    const details = event.details as any

    if (event.appType === APP_TYPES.CHECKOUT) {
      if (details?.sessionId && String(details.sessionId) === targetId) {
        return { label: "Sesión", colorClass: "indigo" }
      }
      return { label: "Trace / ID", colorClass: "orange" }
    }

    if (event.appType === APP_TYPES.REST) {
      if (details?.awsRequestId && String(details.awsRequestId) === targetId) {
        return { label: "AWS Request ID", colorClass: "indigo" }
      }
      if (
        (details?.payload?.id && String(details.payload.id) === targetId) ||
        (event.context?.id && String(event.context.id) === targetId)
      ) {
        return { label: "Interdin ID", colorClass: "indigo" }
      }
      return { label: "Hash", colorClass: "orange" }
    }

    return { label: "ID", colorClass: "orange" }
  }
}
