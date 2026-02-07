import type { NormalizedLogData } from "../../../types"
import type { LogParserStrategy } from "../../LogParserStrategy"

export class CheckoutAwsCsvParser implements LogParserStrategy {
  parse(line: string): NormalizedLogData | null {
    const trimmed = line.trim()

    // 1. FILTRO DE RUIDO (Noise Filtering)
    // Ignoramos encabezados (@timestamp) y líneas de metadatos que empiezan con ",202..."
    // Si la línea empieza con comillas o arroba, no es una línea de datos válida.
    if (trimmed.startsWith('"') || trimmed.startsWith("@")) {
      return null
    }

    // 2. BÚSQUEDA DEL PAYLOAD
    // El formato válido es: FECHA ... ,"{JSON}" ...
    // Buscamos la secuencia mágica: coma + comilla + llave (,"{)
    const jsonMarker = ',"{'
    const markerIndex = trimmed.indexOf(jsonMarker)

    // Si no encontramos el marcador o la línea no empieza con una fecha (año 202x), adiós.
    if (markerIndex === -1 || !/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return null
    }

    try {
      // 3. EXTRACCIÓN QUIRÚRGICA
      // El timestamp es todo lo que hay antes de la coma
      const timestamp = trimmed.substring(0, markerIndex).trim()

      // El JSON empieza en el carácter '{' (markerIndex + 2, saltando la coma y la comilla)
      const startJson = markerIndex + 2

      // Buscamos el último '}' de la línea para cerrar el bloque correctamente
      const endJson = trimmed.lastIndexOf("}")

      if (endJson === -1 || endJson <= startJson) return null

      // Extraemos solo el bloque JSON crudo
      let jsonContent = trimmed.substring(startJson, endJson + 1)

      // 4. NORMALIZACIÓN CSV (CRÍTICO)
      // AWS escapa las comillas dobles poniéndolas dobles (""). Las convertimos a simples (").
      jsonContent = jsonContent.replace(/""/g, '"')

      // 5. PARSEO
      const parsed = JSON.parse(jsonContent)

      // 6. RETORNO LIMPIO
      // Preferimos la fecha exacta que viene dentro del JSON (datetime), si no, la del CSV
      const finalTime = parsed.datetime || timestamp

      return {
        timestamp: finalTime,
        level: parsed.level_name || "INFO",
        message: parsed.message || "Log AWS CSV",
        context: parsed.context || parsed,
        sourceType: "AWS_CSV",
      }
    } catch (e) {
      // Si a pesar de todo falla (JSON roto), retornamos null.
      return null
    }
  }
}
