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
import { LogIngestor } from "../../parsers/LogIngestor"
import {
  buildEventId,
  normalizePath,
  extractHttpFromMessage,
} from "../mapperUtils"
import { ACTION_MAP } from "./CheckoutConfigMap"

export class CheckoutMapper implements LogMapper {
  canHandle(rawInput: any): boolean {
    const data =
      typeof rawInput === "string" ? LogIngestor.parse(rawInput) : rawInput

    if (!data) return false
    const ctx = data.context ?? {}

    return !!(
      ctx.session_id ||
      ctx.data?.session_id ||
      (typeof ctx.TENANT_DOMAIN === "string" &&
        (ctx.TENANT_DOMAIN.includes("checkout") ||
          ctx.TENANT_DOMAIN.includes("redirection"))) ||
      (data.message && data.message.includes("Request trace"))
    )
  }

  isMatch(event: LogEvent, targetId: string): boolean {
    const details = event.details as CheckoutDetails
    const ctx = event.context || {}

    return (
      String(event.id) === targetId ||
      String(details?.sessionId) === targetId ||
      String(ctx?.payload?.session_id) === targetId ||
      String(details?.aws_request_id) === targetId ||
      String(ctx?.aws_request_id) === targetId ||
      String(ctx?.payload?.aws_request_id) === targetId
    )
  }

  map(rawInput: any, rawLine: string, index: number): LogEvent {
    const data: NormalizedLogData =
      typeof rawInput === "string" ? LogIngestor.parse(rawInput)! : rawInput

    const ctx = data.context ?? {}
    const subType = data.context?.type ?? ctx.type ?? null
    const action = ctx.action_method ? String(ctx.action_method).trim() : null
    // Extraemos el gateway para el título
    const gatewayName = ctx.body?.gateway
      ? String(ctx.body.gateway).toUpperCase()
      : null

    let displayMessage = data.message ?? "Sin mensaje"

    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    let category: LogCategory = "GENERIC"
    let source: "FRONTEND" | "BACKEND" | string = "BACKEND"
    let visualLevel: string | null = null

    // --- LÓGICA DE CLASIFICACIÓN ---
    const isValidationErr =
      subType === "request_not_valid" ||
      ctx.exception?.reason === "request_not_valid" ||
      (data.message && data.message.includes("request_not_valid"))

    const isSystemError =
      (["ERROR", "CRITICAL", "ALERT", "EMERGENCY"].includes(data.level) ||
        ctx.exception) &&
      !isValidationErr

    if (isSystemError) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = ctx.exception?.message
        ? `Excepción: ${ctx.exception.message.substring(0, 80)}...`
        : displayMessage.includes("Request trace")
        ? "Error del Sistema (Ver JSON)"
        : displayMessage
    } else if (isValidationErr) {
      category = "ERROR"
      visualLevel = "ERROR"
      displayMessage = "Error de Validación (Request Inválido)"
    }
    // NUEVA LÓGICA: Solicitud de Bancos
    else if (action && action.includes("BanksDataController")) {
      displayMessage = `Solicitud Bancos${
        gatewayName ? ` vía ${gatewayName}` : ""
      }`
      category = "BACKEND_LOG"
      source = "BACKEND"
    } else if (knownAction) {
      displayMessage = knownAction.message
      category = knownAction.category
      source = knownAction.source

      if (action === "process" && ctx.body?.gateway) {
        displayMessage += ` vía ${ctx.body.gateway.toUpperCase()}`
      }
    } else if (displayMessage === "placetopay_event" && subType) {
      displayMessage = `Evento: ${subType}`
      category = "BACKEND_LOG"
    } else {
      category = this.inferCheckoutCategory(displayMessage, subType, ctx)
      source = this.determineSource(data, ctx, knownAction)
    }

    // --- Finalización ---
    const httpInfo = extractHttpFromMessage(data.message ?? "")
    const method =
      ctx.request?.method ??
      httpInfo.method ??
      this.resolveMethod(ctx, action, subType)
    const urlRaw =
      ctx.request?.url ??
      ctx.response?.url ??
      ctx.notification_url ??
      httpInfo.path ??
      ""
    const finalLevel =
      visualLevel || (data.level === "ERROR" ? "INFO" : data.level)

    const awsRequestId =
      ctx.aws_request_id || ctx.payload?.aws_request_id || null

    const details: CheckoutDetails = {
      method,
      url: normalizePath(urlRaw),
      statusCode:
        ctx.response?.status_code ?? ctx.status_code ?? data.level ?? null,
      sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
      transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
      aws_request_id: awsRequestId,
      subType,
      source,
      payload: ctx.payload || ctx,
    }

    return {
      id: buildEventId(ctx, index),
      timestamp: data.timestamp,
      level: finalLevel as LogLevel,
      message: displayMessage,
      category,
      appType: APP_TYPES.CHECKOUT,
      details,
      context: ctx,
      rawStream: rawLine.slice(0, 100) + (rawLine.length > 100 ? "..." : ""),
    }
  }

  getFilterIdentity(event: LogEvent, targetId: string): FilterIdentity {
    const details = event.details as CheckoutDetails
    if (details?.sessionId && String(details.sessionId) === targetId) {
      return { label: "Sesión", colorClass: "indigo" }
    }
    return { label: "AWS / ID", colorClass: "orange" }
  }

  private determineSource(
    data: NormalizedLogData,
    ctx: any,
    knownAction: any
  ): string {
    if (knownAction?.source) return knownAction.source
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
    if (action) return action.toUpperCase()
    return ""
  }

  private inferCheckoutCategory(
    msg: string,
    subType: string | null,
    ctx: any,
    forced?: LogCategory
  ): LogCategory {
    if (forced) return forced
    const m = msg.toLowerCase()
    const s = (subType ?? "").toLowerCase()

    if (s.includes("notification") || m.includes("notify"))
      return "NOTIFICATION"
    if (m.includes("[gw_lib] http req") || m.includes("http req"))
      return "HTTP_REQ_OUT"
    if (m.includes("request trace") || s === "checkout.session.created")
      return "HTTP_REQ_IN"
    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"
    if (
      m.includes("update") ||
      m.includes("db") ||
      m.includes("save") ||
      m.includes("resolving")
    )
      return "DB_OP"
    return "BACKEND_LOG"
  }
}
