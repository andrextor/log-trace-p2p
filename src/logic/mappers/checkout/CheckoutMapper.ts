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
      msg.includes("placetopay_event")
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

    // 1. DETERMINAR MENSAJE Y CATEGORÍA
    // Buscamos en el ACTION_MAP usando el subType o el action (que puede ser el namespace del Controller)
    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    let displayMessage = msgRaw
    let category: LogCategory = "BACKEND_LOG"
    let source = "BACKEND"
    let visualLevel: LogLevel | null = null

    if (knownAction) {
      displayMessage = knownAction.message
      category = knownAction.category
      source = knownAction.source

      // --- ENRIQUECIMIENTO DINÁMICO (Ej: BanksDataController + PSE) ---
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

    // 2. GESTIÓN DE ERRORES (Validación vs Sistema)
    const isValidationErr =
      subType === "request_not_valid" ||
      ctx.exception?.reason === "request_not_valid" ||
      msgRaw.includes("request_not_valid")

    const exception = ctx.exception || null

    if (exception && !isValidationErr) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = `Excepción: ${exception.message?.substring(0, 80)}...`
    } else if (isValidationErr) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = "Error de Validación (Request)"
    }

    // 3. EXTRACCIÓN DE HTTP INFO (Para subtítulo de LogCard)
    const httpInfo = extractHttpFromMessage(msgRaw)
    const rawUrl =
      ctx.request?.url ||
      ctx.response?.url ||
      ctx.notification_url ||
      httpInfo.path ||
      ""

    // Normalizamos el endpoint para que la UI lo detecte
    const endpoint = rawUrl
      ? normalizePath(rawUrl)
      : isValidationErr
      ? "Validation Layer"
      : null

    const method =
      ctx.request?.method ||
      httpInfo.method ||
      this.resolveMethod(ctx, action, subType)

    // 4. CONSTRUCCIÓN DE DETALLES (Cumpliendo BaseDetails y CheckoutDetails)
    const details: CheckoutDetails = {
      method,
      endpoint, // <--- Este campo alimenta el subtítulo de la LogCard
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
      payload: ctx.payload || ctx.data || ctx,
    }

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
    if (action?.includes("Controller")) return "POST" // Acciones de controladores suelen ser POST
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
