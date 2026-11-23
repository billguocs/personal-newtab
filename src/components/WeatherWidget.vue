<template>
  <article class="weather-card" :class="{ 'weather-dark': theme.activeTheme.isDark }" aria-label="天气">
    <div class="weather-viewport" tabindex="0" aria-label="天气信息，可滚动阅读"><Weather /></div>
  </article>
</template>

<script setup lang="ts">
import Weather from './Weather.vue'
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
</script>

<style scoped>
.weather-card { --clock-ink: #1e3b58; --clock-muted: #7188a1; --clock-accent: #467dd2; --weather-cloud: #dceaf6; --weather-cloud-line: #8aa8c5; --weather-surface: linear-gradient(145deg, #f0f7fd, #dfeef8); width: 100%; height: 100%; min-height: var(--standalone-min-height, 0px); min-width: 0; display: flex; flex-direction: column; border-radius: 24px; overflow: hidden; backdrop-filter: blur(var(--widget-blur, 24px)); box-shadow: 0 10px 30px rgba(26,53,84,.1); }
.weather-viewport { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: auto; scrollbar-width: thin; border-radius: inherit; }
.weather-dark { --clock-ink: #e3edf9; --clock-muted: #94abc4; --clock-accent: #91b9f5; --weather-cloud: #4c6685; --weather-cloud-line: #9fb6d2; --weather-surface: linear-gradient(145deg, #192b43, #243f59); }
</style>
