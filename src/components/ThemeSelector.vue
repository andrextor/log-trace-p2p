<script setup lang="ts">
import { ref, onMounted } from 'vue';

type Theme = 'light' | 'dark' | 'system';

const theme = ref<Theme>('system');

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    theme.value = savedTheme;
  }
});

const setTheme = (newTheme: Theme) => {
  theme.value = newTheme;
  const root = document.documentElement;

  if (newTheme === 'system') {
    localStorage.removeItem('theme');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  } else {
    localStorage.setItem('theme', newTheme);
    root.classList.toggle('dark', newTheme === 'dark');
  }
};
</script>

<template>
  <div class="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-lg transition-colors">
    <button 
      @click="setTheme('light')"
      :class="[
        theme === 'light' 
          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-gray-300'
      ]"
      class="p-1.5 rounded-md transition-all cursor-pointer"
      title="Modo Claro"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    </button>

    <button 
      @click="setTheme('dark')"
      :class="[
        theme === 'dark' 
          ? 'bg-slate-800 dark:bg-white/10 text-white dark:text-white shadow-inner' 
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-gray-300'
      ]"
      class="p-1.5 rounded-md transition-all cursor-pointer"
      title="Modo Oscuro"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>

    <button 
      @click="setTheme('system')"
      :class="[
        theme === 'system' 
          ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-0' 
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-gray-300'
      ]"
      class="p-1.5 rounded-md transition-all cursor-pointer"
      title="Tema del Sistema"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </button>
  </div>
</template>