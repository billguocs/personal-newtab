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
  width: 50%;
  margin: 0 auto;
  max-width: 800px;
}

.clock-section {
  @apply flex flex-col;
}

.time {
  @apply text-5xl font-bold tracking-tight;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.date {
  @apply text-base mt-1 opacity-90;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.weather-section {
  @apply flex-shrink-0;
}
</style>