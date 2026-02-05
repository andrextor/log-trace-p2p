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
  const levelFilter = ref("ALL")
  const currentAnalyzer = ref<AnalyzerType>("checkout")
  const highlightedSessionId = ref<string | number | null>(null)
  const selectedEventId = ref<string | null>(null)

  const isProcessing = ref(false)
  const progress = ref(0)

  // --- GETTERS ---

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

  const groupedEvents = computed(() => {
    const groups: Record<string, TimeGroup> = {}
    let blockCounter = 1

    // 1. Ordenar eventos cronológicamente antes de agrupar (importante al acumular logs)
    const sorted = [...filteredEvents.value].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    sorted.forEach((event) => {
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

      const formattedFull = colombiaFormatter.format(dateObj)
      // Agrupamos por minuto (primeros 17 caracteres de "DD/MM/YYYY HH:mm:ss")
      const timeKey = formattedFull.substring(0, 17)

      if (!groups[timeKey]) {
        groups[timeKey] = {
          label: `Bloque ${blockCounter++}`,
          timeDisplay: timeKey,
          events: [],
        }
      }

      // IMPORTANTE: No mutar el objeto original de forma descontrolada
      // Solo actualizamos el formato para la vista si es necesario
      const displayEvent = { ...event, timestamp: formattedDate(dateObj) }
      groups[timeKey].events.push(displayEvent)
    })

    return groups
  })

  // Helper para formatear fecha individualmente
  function formattedDate(date: Date) {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
  }

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

    const interval = setInterval(() => {
      if (progress.value < 95) progress.value += 5
    }, 100)

    try {
      const result = await parseP2PLogs(rawText, currentAnalyzer.value)

      // CAMBIO CLAVE: Acumular logs en lugar de reemplazarlos
      // Usamos un Map o Set si quisiéramos evitar duplicados exactos,
      // pero aquí simplemente los añadimos al final.
      events.value = [...events.value, ...result.events]

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
