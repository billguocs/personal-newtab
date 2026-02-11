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
.clock-widget {
  @apply text-center;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.time {
  @apply text-7xl font-bold tracking-tight;
}

.date {
  @apply text-xl mt-2 opacity-90;
}
</style>