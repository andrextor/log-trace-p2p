import { defineStore } from "pinia"
import { ref, computed, shallowRef } from "vue"
import { APP_TYPES, type LogEvent, type AnalyzerType } from "../logic/types"
import { MapperFactory } from "../logic/mappers/MapperFactory"

export type ViewMode = AnalyzerType | "ALL"

interface TimeGroup {
  label: string
  timeDisplay: string
  timeKey: string
  events: LogEvent[]
}

export const useLogStore = defineStore("logs", () => {
  // --- ESTADO ---
  const events = shallowRef<LogEvent[]>([])
  const activeTab = ref<ViewMode>("ALL")
  const search = ref("")
  const levelFilter = ref("ALL")
  const highlightedSessionId = ref<string | number | null>(null)
  const parsingErrors = ref<string[]>([])
  const isProcessing = ref(false)
  const progress = ref(0)

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

  /**
   * Getter principal con lógica de filtrado desacoplada.
   */
  const filteredEvents = computed(() => {
    const allEvents = events.value
    if (allEvents.length === 0) return []

    const searchTerm = search.value.toLowerCase().trim()
    const activeLevel = levelFilter.value
    const currentTab = activeTab.value

    return allEvents.filter((event) => {
      // 1. Filtro por Aplicación/Pestaña
      if (currentTab !== "ALL" && event.appType !== currentTab) return false

      // 2. Filtro por Nivel de Log
      if (activeLevel !== "ALL" && event.level !== activeLevel) return false

      // 3. FILTRO DE IDENTIDAD GENÉRICO (Estrategia)
      if (highlightedSessionId.value) {
        const targetId = String(highlightedSessionId.value)
        const mapper = MapperFactory.getMapper(event.appType)

        // Delegamos al mapper la decisión de si el evento coincide con el ID resaltado
        if (!mapper.isMatch(event, targetId)) {
          return false
        }
      }

      // 4. Búsqueda por Texto (General)
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

  async function processLogs(rawContent: string, type: AnalyzerType) {
    if (!rawContent.trim()) return

    isProcessing.value = true
    progress.value = 0

    const mapper = MapperFactory.getMapper(type)
    const lines = rawContent.split("\n")
    const totalLines = lines.length
    const newEvents: LogEvent[] = []
    const newErrors: string[] = []
    const CHUNK_SIZE = 500

    for (let i = 0; i < totalLines; i++) {
      const line = lines[i].trim()
      if (line.length < 5) continue

      if (mapper.canHandle(line)) {
        try {
          const event = mapper.map(
            line,
            line,
            events.value.length + newEvents.length + Math.random()
          )
          newEvents.push(event)
        } catch (e) {
          newErrors.push(line)
        }
      } else {
        newErrors.push(line)
      }

      if (i % CHUNK_SIZE === 0) {
        progress.value = Math.round((i / totalLines) * 100)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    events.value = [...events.value, ...newEvents]
    parsingErrors.value = [...parsingErrors.value, ...newErrors]
    activeTab.value = type
    isProcessing.value = false
    progress.value = 100
  }

  function clearLogs() {
    events.value = []
    parsingErrors.value = []
    search.value = ""
    levelFilter.value = "ALL"
    highlightedSessionId.value = null
    progress.value = 0
    activeTab.value = "ALL"
  }

  function toggleHighlight(id: string | number) {
    // Si el ID ya está resaltado, lo quitamos; si no, lo asignamos
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
    toggleHighlight,
  }
})
