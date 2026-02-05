import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent } from "../logic/types"
import { parseP2PLogs } from "../logic/parser"

// Definimos los tipos de analizadores para TypeScript
export type AnalyzerType = "checkout" | "micrositios" | "rest"

export const useLogStore = defineStore("logs", () => {
  // --- ESTADO ---
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL")

  // Nuevo: Controla qué estrategia de parseo se usará
  const currentAnalyzer = ref<AnalyzerType>("checkout")

  /** * highlightedSessionId: Resalta visualmente todos los logs de una misma sesión.
   * selectedEventId: Controla qué log específico tiene abierto su detalle de data (JSON).
   */
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  // --- GETTERS (Computed) ---
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

  // --- ACCIONES ---

  /**
   * Ahora setLogs toma el valor de currentAnalyzer del estado
   * para pasarlo al orquestador del parser.
   */
  function setLogs(rawText: string) {
    // Pasamos el valor actual del analizador seleccionado en la UI
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
    // Nota: No reseteamos currentAnalyzer para mantener la selección del usuario
  }

  function toggleHighlight(sid: string | number) {
    highlightedSessionId.value = highlightedSessionId.value === sid ? null : sid
  }

  function selectEvent(id: string) {
    selectedEventId.value = selectedEventId.value === id ? null : id
  }

  return {
    // Estado
    events,
    search,
    levelFilter,
    currentAnalyzer,
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
