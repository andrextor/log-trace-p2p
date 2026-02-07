import type {
  LogEvent,
  LogLevel,
  LogCategory,
  NormalizedLogData,
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

  map(rawInput: any, rawLine: string, index: number): LogEvent {
    const data: NormalizedLogData =
      typeof rawInput === "string" ? LogIngestor.parse(rawInput)! : rawInput

    const ctx = data.context ?? {}
    const subType = data.context?.type ?? ctx.type ?? null
    const action = ctx.action_method ? String(ctx.action_method).trim() : null

    let displayMessage = data.message ?? "Sin mensaje"

    const actionKey = subType === "checkout.session.created" ? subType : action
    const knownAction = actionKey ? ACTION_MAP[actionKey] : null

    let category: LogCategory = "GENERIC"
    let source: "FRONTEND" | "BACKEND" = "BACKEND"

    // Variable para forzar el nivel visual y que el filtro los atrape
    let visualLevel: string | null = null

    // --- LÓGICA DE CLASIFICACIÓN DE ERRORES ---

    // 1. Detección de Validaciones (request_not_valid)
    // Estos son los que quieres ver en ROJO y en el filtro, pero con título diferente.
    const isValidationErr =
      subType === "request_not_valid" ||
      ctx.exception?.reason === "request_not_valid" ||
      data.message.includes("request_not_valid")

    // 2. Detección de Errores de Sistema (Crashes, Exceptions graves)
    const isSystemError =
      (["ERROR", "CRITICAL", "ALERT", "EMERGENCY"].includes(data.level) ||
        data.message.includes("Exception") ||
        ctx.exception) &&
      !isValidationErr // Si es validación, ya lo manejamos arriba

    if (isSystemError) {
      category = "ERROR"
      visualLevel = "ERROR" // Para el filtro

      if (displayMessage.includes("transaction not found")) {
        displayMessage = "Fallo Crítico: Transacción no encontrada"
      } else if (ctx.exception?.message) {
        displayMessage = `Excepción: ${ctx.exception.message.substring(
          0,
          80
        )}...`
      } else if (
        displayMessage === "Sin mensaje" ||
        displayMessage.includes("Request trace")
      ) {
        displayMessage = "Error del Sistema (Ver JSON)"
      }
    } else if (isValidationErr) {
      category = "ERROR" // <--- AQUÍ ESTÁ LA CLAVE: Lo dejamos como ERROR visual (Rojo)
      visualLevel = "ERROR" // <--- Y como ERROR lógico (Filtro)

      // Pero cambiamos el mensaje para que sepas qué es
      displayMessage = "Error de Validación (Request Inválido)"
    }
    // --- Resto del flujo normal ---
    else if (knownAction) {
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
      source = this.determineSource(data, ctx, knownAction) as any
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

    // Si definimos un nivel visual forzado (ERROR), lo usamos. Si no, usamos el original o INFO.
    const finalLevel =
      visualLevel || (data.level === "ERROR" ? "INFO" : data.level)

    return {
      id: buildEventId(ctx, index),
      timestamp: data.timestamp,
      level: finalLevel as LogLevel,
      message: displayMessage,
      category,
      details: {
        method,
        url: normalizePath(urlRaw),
        statusCode:
          ctx.response?.status_code ?? ctx.status_code ?? data.level ?? null,
        sessionId: ctx.session_id ?? ctx.data?.session_id ?? "",
        transactionId: ctx.transaction_id ?? ctx.placetopay_id ?? "",
        subType,
        source,
      },
      context: ctx,
      rawStream: rawLine.slice(0, 100) + (rawLine.length > 100 ? "..." : ""),
    }
  }

  // --- Helpers ---
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

  private resolveMethod(ctx: any, action: string, subType: string): string {
    if (ctx.request?.method) return ctx.request.method
    if (subType === "checkout.session.created") return "POST"
    if (action === "createSession") return "POST"
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
    if (m.includes("[gw_lib] http req")) return "HTTP_REQ_OUT"
    if (m.includes("request trace")) return "HTTP_REQ_IN"
    if (m.includes("http req")) return "HTTP_REQ_OUT"
    if (m.includes("http res") || m.includes("response")) return "HTTP_RES"
    if (
      m.includes("update") ||
      m.includes("db") ||
      m.includes("save") ||
      m.includes("resolving")
    )
      return "DB_OP"
    if (s === "checkout.session.created") return "HTTP_REQ_IN"

    return "BACKEND_LOG"
  }
}
