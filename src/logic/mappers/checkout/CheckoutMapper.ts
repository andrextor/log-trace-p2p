import {
  APP_TYPES,
  type LogEvent,
  type LogLevel,
  type LogCategory,
  type NormalizedLogData,
  type CheckoutDetails,
  type FilterIdentity,
} from "../../types"
import type { LogMapper } from "../../BaseMapper"
import {
  buildEventId,
  normalizePath,
  extractHttpFromMessage,
} from "../mapperUtils"
import { ACTION_MAP } from "./CheckoutConfigMap"

export class CheckoutMapper implements LogMapper {
  /**
   * Evalúa si la data normalizada pertenece a Checkout o flujos de redirección.
   */
  canHandle(data: NormalizedLogData): boolean {
    if (!data) return false
    const ctx = data.context ?? {}
    const msg = String(data.message || "")

    return !!(
      ctx.session_id ||
      ctx.data?.session_id ||
      (typeof ctx.TENANT_DOMAIN === "string" &&
        (ctx.TENANT_DOMAIN.includes("checkout") ||
          ctx.TENANT_DOMAIN.includes("redirection"))) ||
      msg.includes("Request trace") ||
      msg.includes("placetopay_event") ||
      msg.includes("[GW_LIB]")
    )
  }

  /**
   * Coincidencia robusta para resaltar todo el rastro de una transacción o sesión.
   */
  isMatch(event: LogEvent, targetId: string): boolean {
    const details = event.details as CheckoutDetails
    const ctx = event.context || {}
    const tId = String(targetId).toLowerCase()

    return (
      String(event.id).toLowerCase() === tId ||
      String(details?.sessionId).toLowerCase() === tId ||
      String(details?.transactionId).toLowerCase() === tId ||
      String(details?.aws_request_id).toLowerCase() === tId ||
      String(ctx?.aws_request_id).toLowerCase() === tId ||
      String(ctx?.payload?.session_id).toLowerCase() === tId
    )
  }

  /**
   * Transforma la data cruda en un evento enriquecido para el Timeline.
   */
  map(data: NormalizedLogData, rawLine: string, index: number): LogEvent {
    const ctx = data.context ?? {}
    const subType = ctx.type ?? null
    const action = ctx.action_method ? String(ctx.action_method).trim() : null
    const msgRaw = data.message ?? ""

    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    let displayMessage = msgRaw
    let category: LogCategory = "BACKEND_LOG"
    let source = "BACKEND"
    let visualLevel: LogLevel | null = null
    let provider: string | null = null

    // --- 1. REGLAS ESPECIALES PARA GATEWAY Y CORE ---
    const isGatewayLog = msgRaw.includes("[GW_LIB]")
    const isCoreApiLog = msgRaw === "HTTP Req" || msgRaw === "HTTP Res"
    const requestUrl = ctx.request?.url || ctx.response?.url || ""

    if (isGatewayLog) {
      provider =
        ctx.response?.body?.provider ||
        ctx.request?.body?.payment?.provider ||
        "GATEWAY"
      category = msgRaw.includes("Req") ? "HTTP_REQ_OUT" : "HTTP_RES"

      if (requestUrl.includes("/otp/generate"))
        displayMessage = "Gateway: Generación de OTP"
      else if (requestUrl.includes("/otp/validate"))
        displayMessage = "Gateway: Validación de OTP"
      else if (requestUrl.includes("/mpi/lookup"))
        displayMessage = "Gateway: Consulta 3DS (MPI)"
      else if (requestUrl.includes("/process"))
        displayMessage = "Gateway: Procesar Pago"
      else if (requestUrl.includes("/collect"))
        displayMessage = "Gateway: Cobro / Collect"
      else if (requestUrl.includes("/information"))
        displayMessage = "Gateway: Consulta de Instrumento"
      else
        displayMessage = `Gateway: ${
          msgRaw.includes("Req") ? "Petición Saliente" : "Respuesta"
        }`
    } else if (isCoreApiLog && requestUrl.includes("/core/tokenize")) {
      provider = "CORE_API"
      category = msgRaw.includes("Req") ? "HTTP_REQ_OUT" : "HTTP_RES"
      displayMessage = msgRaw.includes("Req")
        ? "Core: Solicitar Tokenización"
        : "Core: Token Generado"

      // --- 2. REGLAS PARA EVENTOS INTERNOS / BASE DE DATOS ---
    } else if (
      msgRaw.includes("Update session state trace") ||
      msgRaw.includes("Define session trace")
    ) {
      category = "DB_OP"
      displayMessage = "Actualización de Estado (Sesión)"
    } else if (msgRaw.includes("Update transaction trace")) {
      category = "DB_OP"
      displayMessage = "Actualización de Estado (Transacción)"
    } else if (msgRaw.includes("Opening 3DS lightbox")) {
      category = "USER_ACTION"
      displayMessage = "Despliegue de Lightbox 3DS"

      // --- 3. FLUJO NORMAL POR ACTION_MAP ---
    } else if (knownAction) {
      displayMessage = knownAction.message
      category = knownAction.category
      source = knownAction.source

      const gateway = ctx.body?.gateway || ctx.gateway || null
      if (gateway) {
        displayMessage += ` vía ${String(gateway).toUpperCase()}`
      }
    } else if (msgRaw === "placetopay_event" && subType) {
      displayMessage = `Evento: ${subType}`
    } else {
      category = this.inferCheckoutCategory(msgRaw, subType)
      source = this.determineSource(data, ctx)
    }

    // --- 4. GESTIÓN DE ERRORES ---
    const isValidationErr =
      subType === "request_not_valid" ||
      ctx.exception?.reason === "request_not_valid" ||
      msgRaw.toLowerCase().includes("error validation")

    const exception = ctx.exception || null

    if (exception && !isValidationErr) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = `Excepción: ${exception.message?.substring(0, 80)}...`
    } else if (isValidationErr || data.level === 500) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = msgRaw.toLowerCase().includes("otp")
        ? "Error de Validación OTP"
        : "Error de Validación (Request)"
    }

    // --- 5. EXTRACCIÓN DE RUTAS LIMPIAS ---
    const httpInfo = extractHttpFromMessage(msgRaw)
    const rawUrlForEndpoint =
      requestUrl || ctx.notification_url || httpInfo.path || ""

    let endpoint = null
    if (isGatewayLog || isCoreApiLog) {
      try {
        endpoint = rawUrlForEndpoint
          ? new URL(rawUrlForEndpoint).pathname
          : null
      } catch {
        endpoint = normalizePath(rawUrlForEndpoint)
      }
    } else {
      endpoint = rawUrlForEndpoint
        ? normalizePath(rawUrlForEndpoint)
        : isValidationErr
        ? "Validation Layer"
        : null
    }

    const method =
      ctx.request?.method ||
      httpInfo.method ||
      this.resolveMethod(ctx, action, subType)

    // --- 6. CONSTRUCCIÓN DEL EVENTO ---
    const details = {
      method,
      endpoint,
      url: endpoint || undefined,
      statusCode:
        ctx.response?.status_code ??
        ctx.status_code ??
        (category === "ERROR" ? 500 : 200),
      sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
      transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
      aws_request_id: ctx.aws_request_id || ctx.payload?.aws_request_id || null,
      subType,
      source,
      provider,
      payload: ctx.payload || ctx.data || ctx,
    } as CheckoutDetails

    return {
      id: buildEventId(ctx, index),
      timestamp: data.timestamp,
      level: (visualLevel || data.level || "INFO") as LogLevel,
      message: displayMessage,
      category,
      appType: APP_TYPES.CHECKOUT,
      details,
      context: ctx,
      rawStream: msgRaw.slice(0, 200),
    }
  }

  getFilterIdentity(event: LogEvent, targetId: string): FilterIdentity {
    const details = event.details as CheckoutDetails
    if (details?.sessionId && String(details.sessionId) === targetId) {
      return { label: "Sesión", colorClass: "indigo" }
    }
    return { label: "Trace / ID", colorClass: "orange" }
  }

  // --- MÉTODOS PRIVADOS DE APOYO ---

  private determineSource(data: NormalizedLogData, ctx: any): string {
    if (data.message.includes("CLICK_TO_PAY-SDK")) return "BACKEND"
    if (data.channel === "frontend" || ctx.channel === "frontend")
      return "FRONTEND"
    return "BACKEND"
  }

  private resolveMethod(
    ctx: any,
    action: string | null,
    subType: string | null
  ): string {
    if (ctx.request?.method) return ctx.request.method
    if (subType === "checkout.session.created" || action === "createSession")
      return "POST"
    if (action === "show" || action === "index") return "GET"
    if (action?.includes("Controller")) return "POST"
    return "POST"
  }

  private inferCheckoutCategory(
    msg: string,
    subType: string | null
  ): LogCategory {
    const m = msg.toLowerCase()
    const s = (subType ?? "").toLowerCase()

    if (s.includes("notification") || m.includes("notify"))
      return "NOTIFICATION"
    if (m.includes("http req")) return "HTTP_REQ_OUT"
    if (m.includes("request trace") || s === "checkout.session.created")
      return "HTTP_REQ_IN"
    if (m.includes("response")) return "HTTP_RES"
    if (m.includes("update") || m.includes("save") || m.includes("db"))
      return "DB_OP"
    return "BACKEND_LOG"
  }
}
