<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { toast, Toaster } from 'vue-sonner';
import "vue-sonner/style.css"; 
import { useLogStore } from '../store/logStore';
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue'; // Importamos el nuevo componente

const store = useLogStore();
const parseErrors = ref<{ line: number; reason: string; content: string }[]>([]);
const showUploader = computed(() => store.events.length === 0);

const handleLogProcess = async (payload: string) => {
  parseErrors.value = [];
  const promise = () => new Promise((resolve, reject) => {
    try {
      const { events, errors } = store.setLogs(payload);
      parseErrors.value = errors;
      if (events.length > 0) {
        resolve({ count: events.length, errorCount: errors.length });
      } else {
        reject("No se extrajeron eventos válidos.");
      }
    } catch (e) {
      reject(e);
    }
  });

  toast.promise(promise, {
    loading: 'Analizando rastro de logs...',
    success: (data: any) => {
      nextTick().then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      return data.errorCount > 0 
        ? `Cargados ${data.count} eventos (${data.errorCount} errores de línea).`
        : `¡Éxito! ${data.count} eventos cargados.`;
    },
    error: (err: any) => `Error: ${err}`,
  });
};

const handleReset = () => {
  store.clearLogs();
  parseErrors.value = []; 
  toast.info("Espacio de trabajo limpio");
};
</script>

<template>
  <Toaster position="top-right" richColors theme="dark" />

  <div class="max-w-6xl mx-auto px-6 py-10 min-h-screen">
    <transition name="fade" mode="out-in">
      
      <div v-if="showUploader" key="uploader" class="space-y-10">
        <LogUploader @process="handleLogProcess" />

        <div v-if="parseErrors.length > 0" class="animate-in fade-in slide-in-from-top-4 duration-500">
          </div>
      </div>

      <LogTimeline v-else key="results" @reset="handleReset" />

    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>