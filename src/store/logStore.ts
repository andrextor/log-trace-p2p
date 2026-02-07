import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent, AnalyzerType } from "../logic/types"
import { MapperFactory } from "../logic/mappers/MapperFactory"
import { LogIngestor } from "../logic/parsers/LogIngestor" // <--- IMPORTANTE

interface TimeGroup {
  label: string
  timeDisplay: string
  events: LogEvent[]
}

export const useLogStore = defineStore("logs", () => {
  // --- ESTADO ---
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL")
  const currentAnalyzer = ref<AnalyzerType>("checkout")
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  // Estado para el Modal de Errores
  const parsingErrors = ref<string[]>([]) // <--- Aquí guardamos las líneas fallidas

  const isProcessing = ref(false)
  const progress = ref(0)

  // --- GETTERS ---

  const filteredEvents = computed(() => {
    if (events.value.length === 0) return []
    const searchTerm = search.value.toLowerCase()

    return events.value.filter((event) => {
      // Búsqueda por texto, ID de sesión o ID de AWS
      const matchesSearch =
        !searchTerm ||
        event.message.toLowerCase().includes(searchTerm) ||
        event.details.sessionId
          ?.toString()
          .toLowerCase()
          .includes(searchTerm) ||
        event.id?.toString().toLowerCase().includes(searchTerm)

      const matchesLevel =
        levelFilter.value === "ALL" || event.level === levelFilter.value

      return matchesSearch && matchesLevel
    })
  })

  // Helper para formatear fechas a Colombia
  function getColombiaFormatter() {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const groupedEvents = computed(() => {
    const groups: Record<string, TimeGroup> = {}
    let blockCounter = 1
    const formatter = getColombiaFormatter()

    // Ordenamos cronológicamente para el agrupamiento
    const sorted = [...filteredEvents.value].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    sorted.forEach((event) => {
      const dateObj = new Date(event.timestamp)
      if (isNaN(dateObj.getTime())) return

      const formattedFull = formatter.format(dateObj)
      // Agrupamos por minuto (DD/MM/YYYY HH:mm)
      const timeKey = formattedFull.substring(0, 17)

      if (!groups[timeKey]) {
        groups[timeKey] = {
          label: `Bloque ${blockCounter++}`,
          timeDisplay: timeKey,
          events: [],
        }
      }

      // Creamos copia visual con fecha formateada
      const displayEvent = { ...event, timestamp: formattedFull }
      groups[timeKey].events.push(displayEvent)
    })

    return groups
  })

  const stats = computed(() => {
    return {
      total: events.value.length,
      filtered: filteredEvents.value.length,
      errors: events.value.filter(
        (e) => e.level === "ERROR" || e.level === "CRITICAL"
      ).length,
      parsingErrors: parsingErrors.value.length, // <--- Para mostrar badge rojo
    }
  })

  // --- ACCIONES ---

  /**
   * Procesa texto crudo, detecta formato, mapea y acumula.
   */
  async function setLogs(rawText: string) {
    isProcessing.value = true
    progress.value = 0

    // Limpiamos errores de la carga anterior (opcional, o los acumulas también)
    parsingErrors.value = []

    const activeMapper = MapperFactory.getMapper(currentAnalyzer.value)
    const newEvents: LogEvent[] = []

    // Pequeño delay para UI
    await new Promise((resolve) => setTimeout(resolve, 50))

    try {
      const lines = rawText.split("\n")
      const totalLines = lines.length

      for (let i = 0; i < totalLines; i++) {
        const line = lines[i].trim()

        // Ignorar líneas muy cortas o vacías
        if (!line || line.length < 5) continue

        // 1. INGESTIÓN (Strategy Pattern)
        // Intentamos detectar el formato (AWS, Local, Insights)
        const normalizedData = LogIngestor.parse(line, currentAnalyzer.value)

        if (normalizedData) {
          // 2. MAPEO (Factory Pattern)
          // Si se entendió el formato, pasamos la data al Mapper de negocio
          if (activeMapper.canHandle(normalizedData)) {
            try {
              const event = activeMapper.map(normalizedData, line, i + 1)
              newEvents.push(event)
            } catch (err) {
              console.error(`Error mapeando línea ${i + 1}`, err)
              // Si falla el mapeo lógico, también es un error de parsing visual
              parsingErrors.value.push(line)
            }
          } else {
            // El ingestor lo entendió, pero el Mapper dice "no es mío" (raro, pero posible)
            // Lo tratamos como genérico o lo ignoramos.
          }
        } else {
          // 3. ERROR: Ninguna estrategia pudo leer la línea
          parsingErrors.value.push(line)
        }

        // Barra de progreso
        if (i % 500 === 0) {
          progress.value = Math.round((i / totalLines) * 100)
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // 4. ACUMULACIÓN
      // Sumamos lo nuevo a lo viejo
      events.value = [...events.value, ...newEvents]
    } catch (e) {
      console.error("Error crítico en setLogs:", e)
    } finally {
      progress.value = 100
      setTimeout(() => {
        isProcessing.value = false
        progress.value = 0
      }, 500)
    }
  }

  function clearLogs() {
    events.value = []
    parsingErrors.value = [] // Limpiamos errores
    search.value = ""
    levelFilter.value = "ALL"
    highlightedSessionId.value = null
    selectedEventId.value = null
  }

  function toggleHighlight(sid: string | number) {
    highlightedSessionId.value = highlightedSessionId.value === sid ? null : sid
  }

  return {
    events,
    parsingErrors,
    search,
    levelFilter,
    currentAnalyzer,
    highlightedSessionId,
    selectedEventId,
    isProcessing,
    progress,
    filteredEvents,
    groupedEvents,
    stats,
    setLogs,
    clearLogs,
    toggleHighlight,
  }
})
