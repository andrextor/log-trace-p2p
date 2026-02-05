export function buildEventId(ctx: any, index: number): string {
  return (
    ctx.aws_request_id ?? ctx.transaction_id ?? `gen-${index}-${Date.now()}`
  )
}

export function extractTimestamp(data: any, line: string): string {
  if (data.datetime) return data.datetime
  return line.substring(0, 23).replace(/"/g, "")
}
