<script setup lang="ts">
import { toast } from "vue-sonner";
import { useLogStore } from "../../store/logStore";

const store = useLogStore();

function downloadJSON() {
	try {
		if (store.filteredEvents.length === 0) {
			toast.error("No hay datos para exportar");
			return;
		}

		// Estructuramos el JSON con metadata útil
		const exportData = {
			project: "P2P Analizer Report",
			exportDate: new Date().toISOString(),
			analyzerUsed: store.currentAnalyzer,
			totalEvents: store.filteredEvents.length,
			data: store.filteredEvents,
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);

		// Crear link temporal y simular click
		const link = document.createElement("a");
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, 19);

		link.href = url;
		link.download = `p2p-report-${store.currentAnalyzer}-${timestamp}.json`;
		document.body.appendChild(link);
		link.click();

		// Limpieza
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast.success("Archivo JSON descargado correctamente");
	} catch (error) {
		toast.error("Error al generar el archivo");
		console.error(error);
	}
}
</script>

<template>
  <button 
    @click="downloadJSON"
    :disabled="store.filteredEvents.length === 0"
    class="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/20 transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg class="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <span class="text-xs font-bold uppercase tracking-tight">Exportar JSON</span>
  </button>
</template>