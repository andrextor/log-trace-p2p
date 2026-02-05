import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent } from "../logic/types"
import { parseP2PLogs } from "../logic/parser"

export const useLogStore = defineStore("logs", () => {
  // Estado
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL")

  /** * highlightedSessionId: Resalta visualmente todos los logs de una misma sesión.
   * selectedEventId: Controla qué log específico tiene abierto su detalle de data (JSON).
   */
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  // Getters (Computed)
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

  const groupedEvents = computed(() => {
    const groups: Record<string, LogEvent[]> = {}

    filteredEvents.value.forEach((event) => {
      // Agrupamos por minuto: YYYY-MM-DD HH:mm
      const timeBlock = event.timestamp.substring(0, 16)
      if (!groups[timeBlock]) groups[timeBlock] = []
      groups[timeBlock].push(event)
    })

    return groups
  })

  // Acciones
  function setLogs(rawText: string) {
    const result = parseP2PLogs(rawText)
    events.value = result.events
    return result // Retorna { events, errors } para el componente Analyzer
  }

  function clearLogs() {
    events.value = []
    search.value = ""
    levelFilter.value = "ALL"
    highlightedSessionId.value = null
    selectedEventId.value = null
  }

  /**
   * Resalta visualmente todos los eventos que pertenecen a la misma sesión.
   */
  function toggleHighlight(sid: string | number) {
    highlightedSessionId.value = highlightedSessionId.value === sid ? null : sid
  }

  /**
   * Selecciona un único evento para mostrar su detalle técnico (context/data).
   */
  function selectEvent(id: string) {
    selectedEventId.value = selectedEventId.value === id ? null : id
  }

  return {
    // Estado
    events,
    search,
    levelFilter,
    highlightedSessionId,
    selectedEventId,
    // Getters
    filteredEvents,
    groupedEvents,
    // Acciones
    setLogs,
    clearLogs,
    toggleHighlight,
    selectEvent,
  }
})
