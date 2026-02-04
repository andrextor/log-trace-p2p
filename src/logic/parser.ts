export function parseP2PLogs(raw: string): LogEvent[] {
  if (!raw) return []

  const cleanRaw = raw.trim().replace(/^\uFEFF/, "")
  const rows = cleanRaw.split(/\r?\n/)
  const results: LogEvent[] = []

  console.log(`🔍 Iniciando parseo de ${rows.length} líneas...`)

  rows.forEach((row, index) => {
    const line = row.trim()

    // Saltamos cabeceras o líneas vacías
    if (!line || line.includes("@timestamp,@message")) return

    try {
      // Intentamos encontrar el bloque JSON
      const startIdx = line.indexOf("{")
      const endIdx = line.lastIndexOf("}")

      if (startIdx === -1) return // No hay JSON en esta línea, saltar

      let rawJson = line.substring(startIdx, endIdx + 1)

      // Limpieza crítica para CSV de AWS: "" -> "
      const cleanJson = rawJson.replace(/""/g, '"')

      // DEBUG: Solo para la primera línea para no inundar la consola
      if (results.length === 0) {
        console.log("📝 Ejemplo de JSON limpio:", cleanJson.substring(0, 100))
      }

      const data = JSON.parse(cleanJson)
      const ctx = data.context || {}

      results.push({
        id: ctx.aws_request_id || `idx-${index}-${Date.now()}`,
        timestamp: data.datetime || line.substring(0, 23).replace(/"/g, ""),
        level: (data.level_name as LogLevel) || "INFO",
        message: data.message || "Sin mensaje",
        category: inferCategory(data.message || ""),
        details: {
          method: ctx.request?.method || ctx.action_method || "",
          url: ctx.request?.url || ctx.response?.url || "",
          statusCode: ctx.response?.status_code || data.level || null,
          sessionId: ctx.session_id || ctx.data?.session_id || "",
          transactionId: ctx.transaction_id || ctx.placetopay_id || "",
        },
        context: ctx,
        rawStream: line.substring(0, 50),
      })
    } catch (err) {
      // Si falla una línea, queremos saber POR QUÉ
      console.error(
        `❌ Error en línea ${index}:`,
        err instanceof Error ? err.message : err
      )
    }
  })

  console.log(`✅ Parseo terminado. Eventos creados: ${results.length}`)
  return results
}
