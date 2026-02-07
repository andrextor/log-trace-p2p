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
   * Identifica si el log pertenece al flujo REST/SDK o es un rastro interno de Laravel.
   */
  canHandle(data: NormalizedLogData): boolean {
    const msg = String(data.message || "")
    const isLaravelFile = data.context?.filePath?.includes("laravel.log")
    const hasLaravelPattern =
      /production\.(INFO|ALERT|WARNING|CRITICAL|ERROR|NOTICE|DEBUG)/.test(msg)

    return !!(
      data.appType === "rest" ||
      isLaravelFile ||
      hasLaravelPattern ||
      msg.includes("RestSdk") ||
      msg.includes("INTERDIN")
    )
  }

  /**
   * Permite filtrar por IDs de rastro, referencias de Laravel, números de BIN o hashes de ID.
   */
  isMatch(event: LogEvent, targetId: string): boolean {
    const details = event.details as RestDetails
    const tId = String(targetId).toLowerCase()
    const payload = details?.payload || {}

    return (
      String(event.id).toLowerCase() === tId ||
      String(details?.awsRequestId).toLowerCase() === tId ||
      String(event.context?.messageId).toLowerCase() === tId ||
      // Búsqueda por Hash de ID (Caso Interdin)
      String(payload?.id || "")
        .toLowerCase()
        .includes(tId) ||
      String(payload?.reference || "")
        .toLowerCase()
        .includes(tId) ||
      String(payload?.bin || "").includes(tId)
    )
  }

  map(data: NormalizedLogData, rawLine: string, index: number): LogEvent {
    const msgRaw = data.message
    const nrContext = data.context || {}

    // 1. EXTRAER JSON INTERNO (Maneja truncados y bloques múltiples)
    const internalData = this.parseInternalJson(msgRaw)

    // 2. DETECCIÓN DE ORIGEN Y METADATOS BÁSICOS
    const isLaravelLog = msgRaw.includes("production.")
    let displayMessage = ""

    // Extracción dinámica del proveedor
    const provider =
      internalData?.provider ||
      internalData?.TENANT_DOMAIN ||
      internalData?.service ||
      (isLaravelLog ? "LARAVEL" : "API_REST")

    const operation =
      internalData?.operation || (isLaravelLog ? "System Log" : "API Operation")

    // 3. EXTRACCIÓN DE URL / ENDPOINT (Para el subtítulo de LogCard)
    // Navegamos en la estructura del rastro de Interdin o fallbacks de Laravel
    const extractedEndpoint =
      internalData?.context?.endpoint ||
      internalData?.endpoint ||
      nrContext.filePath ||
      null

    const extractedMethod =
      internalData?.context?.method || (isLaravelLog ? "DEBUG" : "POST")

    let category: LogCategory = "BACKEND_LOG"

    if (isLaravelLog) {
      // --- PROCESAMIENTO LARAVEL.LOG (Título Limpio) ---
      category = "APPLICATION_LOG"
      const parts = msgRaw.split("production.")
      if (parts[1]) {
        const levelAndMsg = parts[1].split(": ")
        const messageWithJson = levelAndMsg[1] || ""
        const jsonStart = messageWithJson.indexOf("{")
        displayMessage =
          jsonStart !== -1
            ? messageWithJson.substring(0, jsonStart).trim()
            : messageWithJson.trim()
      }
    } else {
      // --- PROCESAMIENTO SDK / API ---
      const action = internalData?.action || "N/A"
      category = action.toLowerCase().includes("request")
        ? "HTTP_REQ_OUT"
        : "HTTP_RES"

      const knownAction = REST_ACTION_MAP[operation]
      displayMessage = knownAction ? knownAction.message : operation

      // Título enriquecido para el Timeline
      displayMessage += ` | ${action.toUpperCase().replace("-", " ")}`

      // Metadatos de respuesta
      const body =
        internalData?.context?.data?.dinBody || internalData?.data?.dinBody
      if (body?.numeroRegistros > 0 && category === "HTTP_RES") {
        displayMessage += ` (${body.numeroRegistros} registros)`
      }
    }

    // 4. GESTIÓN DE STATUS Y ERRORES
    const exception =
      internalData?.context?.exception ||
      nrContext?.exception ||
      internalData?.exception
    const bizError =
      internalData?.context?.data?.dinError ||
      internalData?.error ||
      internalData?.data?.dinError
    let statusCode: number | string | null = null

    if (exception) {
      category = "ERROR"
      const codeMatch = exception.message?.match(/`(\d{3})`/)
      statusCode = codeMatch ? codeMatch[1] : 500
      displayMessage = `Fallo Crítico [${provider}]: ${exception.message?.substring(
        0,
        60
      )}...`
    } else if (bizError && bizError.codigo && bizError.codigo !== "0000") {
      category = "ERROR"
      statusCode = bizError.codigo
      displayMessage = `${provider} | Error ${statusCode}: ${
        bizError.mensaje || "Op. Fallida"
      }`
    } else {
      statusCode = category === "HTTP_RES" ? 200 : null
    }

    // 5. CONSTRUCCIÓN DE DETALLES (Alineado con BaseDetails)
    const details: RestDetails = {
      provider,
      operation: internalData?.reference
        ? `REF: ${internalData.reference}`
        : operation,
      action: internalData?.action || (isLaravelLog ? "LOG_EVENT" : "N/A"),
      method: extractedMethod,
      endpoint: extractedEndpoint, // Este campo alimenta el subtítulo del LogCard
      statusCode,
      awsRequestId: nrContext.messageId || internalData?.id || null,
      payload: internalData || { raw: msgRaw },
      exception,
      source: "BACKEND",
      isLaravel: isLaravelLog,
    }

    return {
      id: buildEventId(nrContext, index),
      timestamp: data.timestamp,
      level: (category === "ERROR" ? "ERROR" : data.level) as LogLevel,
      message: displayMessage || "Evento de rastro",
      category,
      appType: APP_TYPES.REST,
      details,
      context: nrContext,
      rawStream: msgRaw.slice(0, 250),
    }
  }

  /**
   * Parser avanzado que repara JSON y limpia dobles bloques.
   */
  private parseInternalJson(message: string): any {
    if (typeof message !== "string") return null
    const jsonStart = message.indexOf("{")
    if (jsonStart === -1) return null

    let rawJson = message.substring(jsonStart).trim()

    if (rawJson.includes("(truncated...)")) {
      rawJson = rawJson.split("(truncated...)")[0].trim()
    }

    if (rawJson.includes("} {")) {
      rawJson = rawJson.split("} {")[0] + "}"
    }

    try {
      return JSON.parse(rawJson)
    } catch {
      return this.tryFixTruncatedJson(rawJson)
    }
  }

  private tryFixTruncatedJson(jsonStr: string): any {
    try {
      let fixed = jsonStr
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
    const details = event.details as RestDetails
    const payload = details?.payload || {}
    const tId = String(targetId).toLowerCase()

    // Si el ID buscado es el hash largo de Interdin, usamos Índigo
    if (payload?.id && String(payload.id).toLowerCase().includes(tId)) {
      return { label: "Interdin Hash", colorClass: "indigo" }
    }

    // Para otros IDs técnicos (como AWS Request ID), mantenemos el Naranja
    return { label: "Trace / ID", colorClass: "orange" }
  }
}
