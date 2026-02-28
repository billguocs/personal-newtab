<template>
  <div class="clock-widget">
    <div class="time">{{ time }}</div>
    <div class="date">{{ date }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { formatTime, formatDate } from '@/utils/helpers'

const time = ref('')
const date = ref('')
let rafId: number | null = null
let lastSecond = -1

function update() {
  const now = new Date()
  const currentSecond = now.getSeconds()
  
  if (currentSecond !== lastSecond) {
    lastSecond = currentSecond
    time.value = formatTime(now)
    date.value = formatDate(now)
  }
  
  rafId = requestAnimationFrame(update)
}

onMounted(() => {
  update()
})

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<style scoped>
.clock-widget {
  @apply text-center;
  color: #ffffff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.4);
}

.time {
  @apply text-7xl font-bold tracking-tight;
}

.date {
  @apply text-xl mt-2;
  color: rgba(255, 255, 255, 0.9);
}
</style>