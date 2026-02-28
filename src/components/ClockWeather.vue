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
  width: 60%;
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
  color: #ffffff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.4);
}

.date {
  @apply text-base mt-1;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.weather-section {
  @apply flex-shrink-0;
}
</style>