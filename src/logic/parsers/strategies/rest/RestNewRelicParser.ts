import { APP_TYPES, type NormalizedLogData } from "../../../types"
import type { LogParserStrategy } from "../../LogParserStrategy"

const MONOLOG_LEVEL_REGEX =
  /\.(INFO|DEBUG|WARNING|ERROR|CRITICAL|ALERT|EMERGENCY):/

const REST_SIGNATURE_REGEX = /(InterdinRestSdk|INTERDIN)/

export class RestNewRelicParser implements LogParserStrategy {
  parse(line: string): NormalizedLogData | null {
    // 1. LIMPIEZA BÁSICA DE ARRAY JSON
    const trimmed = line
      .trim()
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .replace(/,$/, "")
      .trim()

    if (!trimmed.startsWith("{")) return null

    let raw: any
    try {
      raw = JSON.parse(trimmed)
    } catch {
      return null
    }

    const messageStr = String(raw.message || "")

    // 2. FILTRO DE PERTINENCIA
    const isRest =
      raw.app === "rest" ||
      raw.app === APP_TYPES.REST ||
      REST_SIGNATURE_REGEX.test(messageStr)

    if (!isRest) return null

    // 3. TIMESTAMP
    const timestamp =
      typeof raw.timestamp === "number" && !isNaN(raw.timestamp)
        ? new Date(raw.timestamp).toISOString()
        : new Date().toISOString()

    // 4. NIVEL (SDK > NewRelic)
    let level = "INFO"
    const monologMatch = messageStr.match(MONOLOG_LEVEL_REGEX)

    if (monologMatch) {
      level = monologMatch[1]
    } else if (raw.logtype === "error") {
      level = "ERROR"
    }

    // 5. EXTRACCIÓN DEL JSON INTERNO DEL SDK
    let sdkPayload: any = null
    const jsonMatch = messageStr.match(/\{.*\}$/s)

    if (jsonMatch) {
      try {
        sdkPayload = JSON.parse(jsonMatch[0])
      } catch {
        sdkPayload = null
      }
    }

    // 6. LIMPIEZA DE BUFFERS HTML (OTP errors)
    if (sdkPayload?.context?.data?.type === "Buffer") {
      sdkPayload.context.data = {
        type: "Buffer",
        size: sdkPayload.context.data.data?.length ?? 0,
        truncated: true,
      }
    }

    // 7. MENSAJE HUMANO LIMPIO
    const cleanMessage = messageStr.replace(/\{.*\}$/s, "").trim()

    return {
      timestamp,
      level,
      message: cleanMessage,
      sourceType: "NEW_RELIC_JSON",
      context: {
        app: raw.app,
        host: raw.hostname,
        instance: raw.displayName,
        tenant: raw.tenant,
        rest: sdkPayload
          ? {
              id: sdkPayload.id,
              provider: sdkPayload.provider,
              action: sdkPayload.action,
              operation: sdkPayload.operation,
              simulatorMode: sdkPayload.simulatorMode,
              context: sdkPayload.context,
            }
          : null,
        meta: {
          file: raw.filePath,
          region: raw.awsRegion,
          az: raw.awsAvailabilityZone,
          instanceType: raw.instanceType,
        },
        raw, // opcional, útil para debugging
      },
    }
  }
}
