import { toast } from "vue-sonner"

export function useFunnelExport() {
  const TOTAL_COLUMNS = 12

  const formatRow = (cells: any[]) => {
    const row = [...cells]
    while (row.length < TOTAL_COLUMNS) row.push("")
    return row.join(";")
  }

  const exportToCSV = (
    data: any[],
    stats: any,
    funnelSteps: any[],
    stepConfig: any[]
  ) => {
    try {
      if (!data.length || !stats) return

      const headers = [
        "ID SESION",
        "TIPO",
        "ESTADO FINAL",
        "PASO DE ABANDONO",
        ...stepConfig.map((s) => s.label.toUpperCase()),
        "DURACION ENTRY",
        "DURACION SHOW",
      ]

      // 1. Cabeceras y Resumen
      const lines = [
        "sep=;",
        formatRow(["REPORTE DE CONVERSION P2P"]),
        formatRow(["Generado el", new Date().toLocaleString()]),
        formatRow(["Total Sesiones Analizadas", stats.total]),
        formatRow(["Conversion Exitosa", `${stats.conversionRate}%`]),
        formatRow([]),
        formatRow(["RETENCION POR PASO"]),
        ...funnelSteps.map((st) =>
          formatRow([st.full, `${st.percentage}%`, `${st.count} usuarios`])
        ),
        formatRow([]),
        formatRow(["DETALLE TECNICO"]),
        formatRow(headers),
      ]

      // 2. Procesamiento de filas
      data.forEach((row) => {
        let lastStepLabel = "Ninguno"
        for (const step of stepConfig) {
          if (row.steps[step.key] === 1) lastStepLabel = step.label
        }

        const isFinished = row.steps.process === 1

        lines.push(
          formatRow([
            row.sessionId,
            row.sessionType,
            isFinished ? "COMPLETADA" : "ABANDONADA",
            isFinished ? "--" : lastStepLabel,
            ...stepConfig.map((sc) => (row.steps[sc.key] === 1 ? "OK" : "")),
            row.durations.timeToEntry || "",
            row.durations.timeToShow || "",
          ])
        )
      })

      // 3. Generación del archivo
      const csvContent = lines.join("\n")
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `p2p-analisis-${new Date().getTime()}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success("Reporte exportado correctamente")
    } catch (e) {
      console.error(e)
      toast.error("Error al generar el reporte")
    }
  }

  return { exportToCSV }
}
