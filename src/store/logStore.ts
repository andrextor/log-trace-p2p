import { defineStore } from "pinia"
import { ref, computed, shallowRef } from "vue"
import { APP_TYPES, type LogEvent, type AnalyzerType } from "../logic/types"
import { MapperFactory } from "../logic/mappers/MapperFactory"
import { LogIngestor } from "../logic/parsers/LogIngestor"

export type ViewMode = AnalyzerType

interface TimeGroup {
  label: string
  timeDisplay: string
  timeKey: string
  events: LogEvent[]
}

export const useLogStore = defineStore("logs", () => {
  // --- ESTADO ---
  // shallowRef es vital para manejar +20,000 líneas sin lag en la UI.
  const events = shallowRef<LogEvent[]>([])
  const activeTab = ref<ViewMode>(APP_TYPES.CHECKOUT)
  const search = ref("")
  const levelFilter = ref("ALL")
  const highlightedSessionId = ref<string | number | null>(null)
  const parsingErrors = ref<string[]>([])
  const isProcessing = ref(false)
  const progress = ref(0)

  /**
   * Registro de huellas digitales (Fingerprints) para evitar duplicados.
   */
  const processedHashes = new Set<string>()

  // --- GETTERS ---

  const counts = computed(() => {
    const c: Record<string, number> = { ALL: events.value.length }
    Object.values(APP_TYPES).forEach((t) => (c[t] = 0))
    events.value.forEach((e) => {
      if (c[e.appType] !== undefined) c[e.appType]++
    })
    return c
  })

  const stats = computed(() => {
    const filtered = filteredEvents.value
    return {
      total: filtered.length,
      globalTotal: events.value.length,
      errors: filtered.filter(
        (e) => e.level === "ERROR" || e.level === "CRITICAL"
      ).length,
    }
  })

  const filteredEvents = computed(() => {
    const allEvents = events.value
    if (allEvents.length === 0) return []

    const searchTerm = search.value.toLowerCase().trim()
    const activeLevel = levelFilter.value
    const currentTab = activeTab.value

    return allEvents.filter((event) => {
      // 1. Filtro de Aplicación: Garantiza que no veas data de Checkout en REST
      if (currentTab !== "ALL" && event.appType !== currentTab) return false

      // 2. Filtro de Nivel
      if (activeLevel !== "ALL" && event.level !== activeLevel) return false

      // 3. Filtro de Identidad (Sesiones/AWS IDs)
      if (highlightedSessionId.value) {
        const targetId = String(highlightedSessionId.value)
        const mapper = MapperFactory.getMapper(event.appType)
        if (!mapper.isMatch(event, targetId)) return false
      }

      // 4. Búsqueda Global por texto
      if (!searchTerm) return true
      return (
        event.message.toLowerCase().includes(searchTerm) ||
        String(event.id).toLowerCase().includes(searchTerm)
      )
    })
  })

  const groupedEvents = computed(() => {
    const groups: Record<string, TimeGroup> = {}
    let blockCounter = 1

    const sorted = [...filteredEvents.value].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    sorted.forEach((event) => {
      const date = new Date(event.timestamp)
      if (isNaN(date.getTime())) return

      const timeKey = date.toLocaleString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })

      if (!groups[timeKey]) {
        groups[timeKey] = {
          label: `Bloque ${blockCounter++}`,
          timeDisplay: timeKey,
          timeKey: timeKey,
          events: [],
        }
      }
      groups[timeKey].events.push(event)
    })
    return groups
  })

  // --- ACCIONES ---

  /**
   * Motor de procesamiento universal.
   *
   */
  async function processLogs(rawContent: string, type: AnalyzerType | "ALL") {
    if (!rawContent.trim()) return

    isProcessing.value = true
    progress.value = 0

    try {
      const lines = rawContent.split("\n").filter((l) => l.trim().length > 5)
      const totalLines = lines.length
      const newEvents: LogEvent[] = []
      const CHUNK_SIZE = 200

      for (let i = 0; i < totalLines; i++) {
        const line = lines[i].trim()

        // 1. Ingestión y detección automática de App
        const parseResults = LogIngestor.parse(line, type)

        for (const normalizedData of parseResults) {
          // Si detectamos logs de otra App, actualizamos la pestaña para que la UI viaje al timeline
          if (
            activeTab.value !== normalizedData.inferredApp &&
            activeTab.value !== "ALL"
          ) {
            activeTab.value = normalizedData.inferredApp
          }

          const msgStr = String(normalizedData.message || "")
          const fingerprint = `${normalizedData.timestamp}_${msgStr.slice(
            0,
            60
          )}`

          if (!processedHashes.has(fingerprint)) {
            try {
              // 2. Mapeo Dinámico según lo que detectó el Ingestor
              const dynamicMapper = MapperFactory.getMapper(
                normalizedData.inferredApp
              )

              const event = dynamicMapper.map(
                normalizedData,
                line,
                events.value.length + newEvents.length
              )

              newEvents.push(event)
              processedHashes.add(fingerprint)
            } catch (e) {
              parsingErrors.value.push(line)
            }
          }
        }

        // 3. UI Breathing: Evita que el navegador se bloquee al 0%
        if (i % CHUNK_SIZE === 0 || i === totalLines - 1) {
          progress.value = Math.round(((i + 1) / totalLines) * 100)
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // 4. Actualización masiva por concatenación (seguro para memoria)
      events.value = events.value.concat(newEvents)
    } catch (criticalError) {
      console.error("Fallo crítico en el motor de logs:", criticalError)
    } finally {
      isProcessing.value = false
      progress.value = 100
    }
  }

  /**
   * NUEVO: Borrado Contextual.
   * Elimina solo los logs de la aplicación actual sin tocar el resto.
   */
  function clearLogsByApp(type: AnalyzerType) {
    // 1. Filtramos para mantener solo lo que NO es de esta aplicación
    events.value = events.value.filter((e) => e.appType !== type)

    // 2. RE-SINCRONIZACIÓN DE HASHES:
    // Vaciamos el Set y lo volvemos a llenar con los logs que quedaron.
    // Esto permite volver a subir el mismo archivo borrado sin que sea ignorado.
    processedHashes.clear()
    events.value.forEach((e) => {
      const fingerprint = `${e.timestamp}_${e.message.slice(0, 60)}`
      processedHashes.add(fingerprint)
    })

    // Limpiamos errores de parseo (opcional)
    parsingErrors.value = []
  }

  function clearLogs() {
    events.value = []
    parsingErrors.value = []
    processedHashes.clear()
    search.value = ""
    levelFilter.value = "ALL"
    highlightedSessionId.value = null
    progress.value = 0
  }

  function toggleHighlight(id: string | number) {
    highlightedSessionId.value = highlightedSessionId.value === id ? null : id
    if (highlightedSessionId.value) search.value = ""
  }

  return {
    events,
    activeTab,
    parsingErrors,
    search,
    levelFilter,
    highlightedSessionId,
    isProcessing,
    progress,
    stats,
    counts,
    filteredEvents,
    groupedEvents,
    currentAnalyzer: activeTab,
    processLogs,
    clearLogs,
    clearLogsByApp,
    toggleHighlight,
  }
})
