export {
  APP_TYPES,
  ANALYZER_NAMES,
  type AnalyzerType,
  type LogLevel,
  type LogCategory,
  type BaseDetails,
  type LogEvent,
  type NormalizedLogData,
} from "../shared/types"

export type { CheckoutDetails, MicrositiosDetails, SessionFunnelSteps, SessionFunnelRow } from "../domains/checkout/types"
export type { RestDetails } from "../domains/rest/types"

export type AppLogDetails =
  | import("../domains/checkout/types").CheckoutDetails
  | import("../domains/rest/types").RestDetails
  | import("../domains/checkout/types").MicrositiosDetails
