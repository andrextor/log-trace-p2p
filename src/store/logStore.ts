import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent } from "../logic/types"
import { parseP2PLogs } from "../logic/parser"

export type AnalyzerType = "checkout" | "micrositios" | "rest"

interface TimeGroup {
  label: string
  timeDisplay: string
  events: LogEvent[]
}

export const useLogStore = defineStore("logs", () => {
  // --- ESTADO ---
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL") // Puede ser 'ALL', 'ERROR', 'INFO', etc.
  const currentAnalyzer = ref<AnalyzerType>("checkout")
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  // Estado para la barra de progreso
  const isProcessing = ref(false)
  const progress = ref(0)

  // --- GETTERS ---

  // Filtrado principal de eventos
  const filteredEvents = computed(() => {
    if (events.value.length === 0) return []
    const searchTerm = search.value.toLowerCase()

    return events.value.filter((event) => {
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

  // Agrupador por bloques de tiempo (Minuto)
  const groupedEvents = computed(() => {
    const groups: Record<string, TimeGroup> = {}
    let blockCounter = 1

    filteredEvents.value.forEach((event) => {
      const dateObj = new Date(event.timestamp)
      if (isNaN(dateObj.getTime())) return

      const colombiaFormatter = new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })

      const formattedDate = colombiaFormatter.format(dateObj)
      // Agrupamos por minuto (los primeros 17 caracteres: "DD/MM/YYYY HH:mm")
      const timeKey = formattedDate.substring(0, 17)

      if (!groups[timeKey]) {
        groups[timeKey] = {
          label: `Bloque ${blockCounter++}`,
          timeDisplay: timeKey,
          events: [],
        }
      }

      // El timestamp del evento mantiene los segundos para el detalle
      event.timestamp = formattedDate
      groups[timeKey].events.push(event)
    })

    return groups
  })

  // Estadísticas rápidas
  const stats = computed(() => {
    return {
      total: events.value.length,
      filtered: filteredEvents.value.length,
      errors: events.value.filter((e) => e.level === "ERROR").length,
    }
  })

  // --- ACCIONES ---

  async function setLogs(rawText: string) {
    isProcessing.value = true
    progress.value = 0

    // Simulación de progreso para archivos grandes
    const interval = setInterval(() => {
      if (progress.value < 95) progress.value += 5
    }, 100)

    try {
      // Ejecutamos el parseo usando el analizador seleccionado
      const result = await parseP2PLogs(rawText, currentAnalyzer.value)
      events.value = result.events
      progress.value = 100
      return result
    } finally {
      clearInterval(interval)
      setTimeout(() => {
        isProcessing.value = false
        progress.value = 0
      }, 500)
    }
  }

  function clearLogs() {
    events.value = []
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
