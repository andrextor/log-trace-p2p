export function buildEventId(ctx: any, index: number): string {
  return (
    ctx.aws_request_id ?? ctx.transaction_id ?? `gen-${index}-${Date.now()}`
  )
}

export function extractTimestamp(data: any, line: string): string {
  if (data.datetime) return data.datetime
  return line.substring(0, 23).replace(/"/g, "")
}

export function normalizePath(path: string): string {
  return path
    .replace(/%22|&quot|"/g, "")
    .replace(/\/+$/, "")
}

export function extractHttpFromMessage(message: string): {
  method?: string
  path?: string
} {
  const match = message.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)/i)
  if (!match) return {}

  return {
    method: match[1],
    path: normalizePath(match[2]),
  }
}
