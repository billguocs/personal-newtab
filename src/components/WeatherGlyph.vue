<template>
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <g v-if="kind === 'sun' || kind === 'partly'" class="sun" :transform="kind === 'partly' ? 'translate(-7 -7)' : undefined" stroke="#dfaa47" stroke-width="2.5" stroke-linecap="round">
      <circle cx="26" cy="26" r="10" fill="#f5ce73" />
      <path d="M26 8v4m0 28v4M8 26h4m28 0h4M13 13l3 3m20 20 3 3M13 39l3-3m20-20 3-3" />
    </g>
    <path v-if="kind !== 'sun'" d="M17 43a10 10 0 0 1-1-20 15 15 0 0 1 29-1 11 11 0 1 1 3 21H17Z" fill="var(--weather-cloud, #e1ecf8)" stroke="var(--weather-cloud-line, #8aa8c5)" stroke-width="2" />
    <g v-if="kind === 'rain'" stroke="#6b9dda" stroke-width="2.5" stroke-linecap="round"><path d="m23 49-3 6m14-6-3 6m14-6-3 6" /></g>
    <g v-if="kind === 'snow'" fill="#8db6d7"><circle cx="23" cy="52" r="2" /><circle cx="35" cy="55" r="2" /><circle cx="46" cy="51" r="2" /></g>
    <path v-if="kind === 'storm'" d="m34 43-8 10h8l-4 8 15-13h-9l4-5" fill="#e8b855" />
    <path v-if="kind === 'fog'" d="M15 48h36M20 54h26" stroke="#8aa8c5" stroke-width="2.5" stroke-linecap="round" />
  </svg>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ code: number }>()
const kind = computed(() => {
  if (props.code === 0) return 'sun'
  if (props.code === 1 || props.code === 2) return 'partly'
  if (props.code === 45 || props.code === 48) return 'fog'
  if (props.code >= 95) return 'storm'
  if ([71, 73, 75, 77, 85, 86].includes(props.code)) return 'snow'
  if (props.code >= 51 && props.code <= 82) return 'rain'
  return 'cloud'
})
</script>
