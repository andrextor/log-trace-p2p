import {
  APP_TYPES,
  type LogEvent,
  type LogLevel,
  type LogCategory,
  type RestDetails,
  type NormalizedLogData,
} from "../../types"
import type { LogMapper, FilterIdentity } from "../../BaseMapper"
import { buildEventId } from "../mapperUtils"
import { REST_ACTION_MAP } from "./RestConfigMap"

export class RestMapper implements LogMapper {
  /**
   * Verifica si la data normalizada pertenece al flujo de REST.
   */
  canHandle(data: NormalizedLogData): boolean {
    const isRestApp =
      data.context?.app === "rest" || data.context?.app === APP_TYPES.REST
    const message = String(data.message || "")
    const hasSdkSignature =
      message.includes("RestSdk") || message.includes("INTERDIN")

    return !!(isRestApp || hasSdkSignature)
  }

  /**
   * Coincidencia de IDs para el resaltado de rastro (Highlight).
   */
  isMatch(event: LogEvent, targetId: string): boolean {
    const details = event.details as RestDetails
    const ctx = event.context || {}
    const tId = String(targetId)

    return (
      String(event.id) === tId ||
      String(details?.awsRequestId) === tId ||
      String(ctx?.messageId) === tId ||
      String(details?.payload?.id) === tId // ID interno de transacción Interdin
    )
  }

  /**
   * Transforma la data normalizada de New Relic en un evento visual.
   */
  map(data: NormalizedLogData, rawLine: string, index: number): LogEvent {
    // 1. Extraemos el JSON interno de Interdin/SDK
    const internalData = this.parseRestLine(data.message)
    const nrContext = data.context || {} // Este es el objeto raíz de New Relic
    const operation = internalData?.operation

    // 2. Título base: Limpiamos el ruido de Monolog (Fecha, Canal, Nivel)
    let displayMessage = data.message
      .split(" {")[0]
      .replace(/^\[.*\]\s.*\.(INFO|DEBUG|WARNING|ERROR):\s/, "")
      .trim()

    const knownAction = operation ? REST_ACTION_MAP[operation] : null
    let category: LogCategory = "BACKEND_LOG"
    let statusCode: number | string | null = null

    // 3. Lógica de Identidad Visual (Basada en REST_ACTION_MAP)
    if (knownAction) {
      const provider = internalData?.provider || "INTERDIN"
      const actionLabel = internalData?.action
        ? `[${internalData.action.toUpperCase()}]`
        : ""
      displayMessage = `${provider} ${actionLabel}: ${knownAction.message}`
      category = internalData?.action?.includes("request")
        ? "HTTP_REQ_OUT"
        : "HTTP_RES"
    }

    // 4. CAPTURA SEGURA DE ERRORES (Guzzle o Errores de Negocio)
    // Buscamos la excepción tanto en el JSON interno como en el raíz de New Relic
    const internalCtx = internalData?.context || {}
    const exception = internalCtx?.exception || nrContext?.exception || null

    if (exception) {
      category = "ERROR"
      const errorMsg = exception.message || ""
      // Regex para capturar el código (ej: 503 Service Unavailable)
      const codeMatch = errorMsg.match(/resulted in a `(\d{3})`/)
      statusCode = codeMatch ? codeMatch[1] : 500
      displayMessage = `Fallo en Servicio: ${errorMsg.substring(0, 65)}...`
    } else if (
      internalData?.data?.dinError?.codigo &&
      internalData?.data?.dinError?.codigo !== "0000"
    ) {
      category = "ERROR"
      displayMessage = `Error Interdin: ${internalData.data.dinError.mensaje}`
      statusCode = internalData.data.dinError.codigo
    } else {
      // Si el log es de respuesta y no hay error, asumimos éxito para el badge
      statusCode = category === "HTTP_RES" ? 200 : null
    }

    // 5. Construcción de Detalles para la UI
    const details: RestDetails = {
      provider: internalData?.provider || "REST",
      operation: operation || "N/A",
      action: internalData?.action || "N/A",
      method: internalCtx?.method || "POST",
      endpoint: internalCtx?.endpoint || "N/A",
      statusCode: statusCode, // Esto activa el color del badge en LogCard.vue
      awsRequestId: nrContext.messageId || internalData?.id || null,
      payload: internalData || nrContext,
      exception: exception,
      source: "BACKEND",
    }

    return {
      id: buildEventId(nrContext, index),
      timestamp: data.timestamp,
      level: category === "ERROR" ? "ERROR" : (data.level as LogLevel),
      message: displayMessage,
      category,
      appType: APP_TYPES.REST,
      details,
      context: nrContext,
      rawStream: data.message.slice(0, 150),
    }
  }

  /**
   * PARSER INTERNO: Extrae el objeto JSON de la cadena de mensaje de New Relic.
   */
  private parseRestLine(message: string): any {
    if (typeof message !== "string") return null
    const jsonStart = message.indexOf("{")
    if (jsonStart === -1) return null

    const rawJson = message.substring(jsonStart).trim()
    try {
      return JSON.parse(rawJson)
    } catch (e) {
      return this.tryFixTruncatedJson(rawJson)
    }
  }

  private tryFixTruncatedJson(jsonStr: string): any {
    try {
      let fixed = jsonStr.split(" (truncated...)")[0].trim()
      const openBraces = (fixed.match(/\{/g) || []).length
      const closeBraces = (fixed.match(/\}/g) || []).length
      if (openBraces > closeBraces) {
        fixed += "}".repeat(openBraces - closeBraces)
      }
      return JSON.parse(fixed)
    } catch {
      return null
    }
  }

  getFilterIdentity(event: LogEvent, targetId: string): FilterIdentity {
    return { label: "AWS / Trace ID", colorClass: "orange" }
  }
}
