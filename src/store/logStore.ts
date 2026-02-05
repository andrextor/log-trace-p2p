import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent } from "../logic/types"
import { parseP2PLogs } from "../logic/parser"

export type AnalyzerType = "checkout" | "micrositios" | "rest"

// Estructura clara para que el componente Timeline no se rompa
interface TimeGroup {
  label: string
  timeDisplay: string // Para mostrar HH:mm en el encabezado del bloque
  events: LogEvent[]
}

export const useLogStore = defineStore("logs", () => {
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL")
  const currentAnalyzer = ref<AnalyzerType>("checkout")
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  const filteredEvents = computed(() => {
    if (events.value.length === 0) return []
    const searchTerm = search.value.toLowerCase()

    return events.value.filter((event) => {
      const matchesSearch =
        !searchTerm ||
        event.message.toLowerCase().includes(searchTerm) ||
        event.details.sessionId?.toString().includes(searchTerm) ||
        event.details.transactionId?.toString().includes(searchTerm)

      const matchesLevel =
        levelFilter.value === "ALL" || event.level === levelFilter.value

      return matchesSearch && matchesLevel
    })
  })

  /**
   * Agrupador por Bloques (Minuto) y Visualización (Segundos)
   * Formato Colombia: DD/MM/YYYY, HH:mm:ss
   */
  const groupedEvents = computed(() => {
    const groups: Record<string, TimeGroup> = {}
    let blockCounter = 1

    filteredEvents.value.forEach((event) => {
      const dateObj = new Date(event.timestamp)
      if (isNaN(dateObj.getTime())) return

      // Formateador completo para Colombia (Bogotá)
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

      /**
       * LLAVE DE AGRUPACIÓN: Por Minuto
       * formattedDate es "04/02/2026, 22:15:30"
       * timeKey será "04/02/2026, 22:15" (Cortamos antes de los segundos)
       */
      const timeKey = formattedDate.substring(0, 17)

      if (!groups[timeKey]) {
        groups[timeKey] = {
          label: `Bloque ${blockCounter++}`,
          timeDisplay: timeKey,
          events: [],
        }
      }

      // Sobrescribimos con el formato completo (incluyendo segundos) para la Card
      event.timestamp = formattedDate

      groups[timeKey].events.push(event)
    })

    return groups
  })

  function setLogs(rawText: string) {
    const result = parseP2PLogs(rawText, currentAnalyzer.value)
    events.value = result.events
    return result
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

  function selectEvent(id: string) {
    selectedEventId.value = selectedEventId.value === id ? null : id
  }

  return {
    events,
    search,
    levelFilter,
    currentAnalyzer,
    highlightedSessionId,
    selectedEventId,
    filteredEvents,
    groupedEvents,
    setLogs,
    clearLogs,
    toggleHighlight,
    selectEvent,
  }
})
