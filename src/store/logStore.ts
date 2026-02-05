import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { LogEvent } from "../logic/types"
import { parseP2PLogs } from "../logic/parser"

export const useLogStore = defineStore("logs", () => {
  const events = ref<LogEvent[]>([])
  const search = ref("")
  const levelFilter = ref("ALL")
  const highlightedSessionId = ref<string | number | null>(null)

  const filteredEvents = computed(() => {
    if (events.value.length === 0) return []
    return events.value.filter((event) => {
      const matchesSearch =
        !search.value ||
        event.message.toLowerCase().includes(search.value.toLowerCase()) ||
        event.details.sessionId?.toString().includes(search.value)
      const matchesLevel =
        levelFilter.value === "ALL" || event.level === levelFilter.value
      return matchesSearch && matchesLevel
    })
  })

  const groupedEvents = computed(() => {
    const groups: Record<string, LogEvent[]> = {}
    filteredEvents.value.forEach((event) => {
      const timeBlock = event.timestamp.substring(0, 16)
      if (!groups[timeBlock]) groups[timeBlock] = []
      groups[timeBlock].push(event)
    })
    return groups
  })

  // ACCIONES
  function setLogs(rawText: string) {
    console.log("Store: Recibiendo logs para procesar...")

    const { events: parsedEvents, errors } = parseP2PLogs(rawText)

    console.log(
      `✅ Store: Procesado. Eventos: ${parsedEvents.length}, Errores: ${errors.length}`
    )
    events.value = parsedEvents
    return { events: parsedEvents, errors }
  }

  function clearLogs() {
    events.value = []
    search.value = ""
    highlightedSessionId.value = null
  }

  function toggleHighlight(sid: string | number) {
    highlightedSessionId.value = highlightedSessionId.value === sid ? null : sid
  }

  return {
    events,
    search,
    levelFilter,
    highlightedSessionId,
    filteredEvents,
    groupedEvents,
    setLogs,
    clearLogs,
    toggleHighlight,
  }
})
