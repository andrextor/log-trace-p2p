import type { BaseDetails } from "../../shared/types"

export interface ExceptionInfo {
  message: string
  file?: string
  line?: number
  trace?: string
}

export interface RestDetails extends BaseDetails {
  provider: string
  operation: string
  action: string
  awsRequestId?: string | null
  exception?: ExceptionInfo | null
  isLaravel?: boolean
}
