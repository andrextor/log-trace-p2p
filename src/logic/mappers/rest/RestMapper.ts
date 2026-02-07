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
   * Permite filtrar por IDs de rastro, referencias de Laravel o números de BIN.
   */
  isMatch(event: LogEvent, targetId: string): boolean {
    const details = event.details as RestDetails
    const tId = String(targetId).toLowerCase()
    // Buscamos en el payload (donde el mapper guarda los datos extraídos)
    const payload = details?.payload || {}

    return (
      String(event.id).toLowerCase() === tId ||
      String(details?.awsRequestId).toLowerCase() === tId ||
      String(event.context?.messageId).toLowerCase() === tId ||
      String(payload?.reference || "")
        .toLowerCase()
        .includes(tId) ||
      String(payload?.bin || "").includes(tId) ||
      String(payload?.id || "").toLowerCase() === tId
    )
  }

  map(data: NormalizedLogData, rawLine: string, index: number): LogEvent {
    const msgRaw = data.message
    const nrContext = data.context || {}

    // 1. EXTRAER JSON INTERNO (Soporte para truncados de New Relic y dobles bloques de Laravel)
    const internalData = this.parseInternalJson(msgRaw)

    // 2. DETECCIÓN DE ORIGEN Y METADATOS
    const isLaravelLog = msgRaw.includes("production.")
    let displayMessage = ""
    let provider =
      internalData?.provider ||
      internalData?.TENANT_DOMAIN ||
      internalData?.service ||
      "API_REST"
    let operation =
      internalData?.operation || (isLaravelLog ? "System Log" : "API Operation")

    // 3. EXTRACCIÓN DE URL / ENDPOINT (Solución al error N/A)
    // Buscamos en internalData.context.endpoint (Estructura Interdin) o en la raíz
    const extractedEndpoint =
      internalData?.context?.endpoint ||
      internalData?.endpoint ||
      nrContext.filePath ||
      "N/A"

    const extractedMethod =
      internalData?.context?.method || (isLaravelLog ? "DEBUG" : "POST")

    let category: LogCategory = "BACKEND_LOG"

    if (isLaravelLog) {
      // --- PROCESAMIENTO LARAVEL.LOG ---
      category = "APPLICATION_LOG"
      const parts = msgRaw.split("production.")
      if (parts[1]) {
        const levelAndMsg = parts[1].split(": ")
        const messageWithJson = levelAndMsg[1] || ""
        const jsonStart = messageWithJson.indexOf("{")
        // El título es el texto antes del JSON de contexto
        displayMessage =
          jsonStart !== -1
            ? messageWithJson.substring(0, jsonStart).trim()
            : messageWithJson.trim()
      }
      provider =
        internalData?.TENANT_DOMAIN || internalData?.service || "LARAVEL"
    } else {
      // --- PROCESAMIENTO SDK / API ---
      const action = internalData?.action || "N/A"
      category = action.toLowerCase().includes("request")
        ? "HTTP_REQ_OUT"
        : "HTTP_RES"

      const knownAction = REST_ACTION_MAP[operation]
      displayMessage = knownAction ? knownAction.message : operation
      // Añadimos el tipo de acción al título para el Timeline
      displayMessage += ` | ${action.toUpperCase().replace("-", " ")}`

      // Metadatos de respuesta (Ej: "7 registros")
      const body =
        internalData?.context?.data?.dinBody || internalData?.data?.dinBody
      if (body?.numeroRegistros > 0 && category === "HTTP_RES") {
        displayMessage += ` (${body.numeroRegistros} registros)`
      }
    }

    // 4. GESTIÓN DE STATUS Y ERRORES (Excepciones vs Códigos de Negocio)
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

    // 5. CONSTRUCCIÓN DE DETALLES NORMALIZADOS PARA LA UI
    const details: RestDetails & { isLaravel?: boolean } = {
      provider,
      operation: internalData?.reference
        ? `REF: ${internalData.reference}`
        : operation,
      action: internalData?.action || (isLaravelLog ? "LOG_EVENT" : "N/A"),
      method: extractedMethod,
      endpoint: extractedEndpoint,
      statusCode,
      awsRequestId: nrContext.messageId || internalData?.id || null,
      payload: internalData || { raw: msgRaw }, // Guardamos TODO el objeto procesado
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
   * Parser avanzado que repara JSON cortados por New Relic y limpia dobles bloques de Laravel.
   */
  private parseInternalJson(message: string): any {
    if (typeof message !== "string") return null
    const jsonStart = message.indexOf("{")
    if (jsonStart === -1) return null

    let rawJson = message.substring(jsonStart).trim()

    // 1. Quitar marcador de truncado
    if (rawJson.includes("(truncated...)")) {
      rawJson = rawJson.split("(truncated...)")[0].trim()
    }

    // 2. Manejar formato Laravel: "{contexto} {extra}" (tomamos el primero que es el más rico)
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
    return { label: "Trace / Ref", colorClass: "orange" }
  }
}
