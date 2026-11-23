<template>
  <div class="clock-weather-widget">
    <!-- 左侧时间 -->
    <div class="clock-section">
      <div class="time">{{ time }}</div>
      <div class="date">{{ date }}</div>
    </div>
    
    <!-- 右侧天气 -->
    <div class="weather-section">
      <Weather />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Weather from './Weather.vue'
import { formatTime, formatDate } from '@/utils/helpers'

const time = ref('')
const date = ref('')
let timer: number

function update() {
  const now = new Date()
  time.value = formatTime(now)
  date.value = formatDate(now)
}

onMounted(() => {
  update()
  timer = window.setInterval(update, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.clock-weather-widget {
  @apply flex items-center justify-between px-4 py-2;
  width: 100%;
  height: 100%;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0 auto;
  max-width: 800px;
  gap: 16px;
}

.clock-section {
  @apply flex flex-col;
  flex-shrink: 0;
}

.time {
  @apply text-5xl font-bold tracking-tight;
  color: var(--text-primary);
  text-shadow: none;
}

.date {
  @apply text-base mt-1;
  color: var(--text-secondary);
  text-shadow: none;
}

.weather-section {
  @apply flex-shrink-0;
}
.clock-section { min-width: 0; flex-shrink: 1; }
.weather-section { min-width: 0; flex-shrink: 1; }
@media (max-width: 520px) { .clock-weather-widget { flex-direction: column; padding: 24px 16px; } .clock-section { text-align: center; } }
</style>