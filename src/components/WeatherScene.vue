<template>
  <div class="weather-scene" :class="[kind, { heavy }]" aria-hidden="true">
    <div v-if="kind === 'sun' || kind === 'partly'" class="sun-glow"><div class="sun-rays"></div><div class="sun-disc"></div></div>
    <template v-if="kind !== 'sun' && kind !== 'neutral'">
      <div class="cloud cloud-one"></div><div class="cloud cloud-two"></div>
    </template>
    <template v-if="kind === 'rain' || kind === 'storm' || kind === 'snow'">
      <i v-for="n in particleCount" :key="n" class="particle" :style="particleStyle(n)"></i>
    </template>
    <div v-if="kind === 'fog'" class="fog-bank"></div>
    <div v-if="kind === 'storm'" class="lightning"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ code?: number }>()
// WMO 当前天气码，与天气数据同步；不发起额外请求或使用动画计时器。
const kind = computed(() => {
  const code = props.code
  if (code == null || code < 0) return 'neutral'
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'partly'
  if (code === 45 || code === 48) return 'fog'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  return 'cloudy'
})
const heavy = computed(() => [55, 57, 65, 67, 75, 82, 86, 95, 96, 99].includes(props.code ?? -1))
const particleCount = computed(() => heavy.value ? 32 : kind.value === 'snow' ? 18 : 12)
function particleStyle(n: number) {
  const snow = kind.value === 'snow'
  const duration = snow ? 5 + n % 5 : heavy.value ? .55 + (n % 5) * .08 : 1.1 + (n % 5) * .12
  return {
    left: `${(n * 37) % 100}%`,
    '--duration': `${duration}s`,
    '--delay': `${-n * .73}s`,
    '--drift': `${snow ? (n % 2 ? 24 : -18) : -26}px`,
    '--flake-size': `${2 + n % 4}px`
  }
}
</script>

<style scoped>
.weather-scene { position: absolute; inset: 0; z-index: -1; overflow: hidden; border-radius: 16px; pointer-events: none; opacity: var(--widget-opacity, .85); background: linear-gradient(155deg, rgba(161,204,235,.1), rgba(129,180,222,.2)); }
.sun, .partly { background: linear-gradient(145deg, rgba(255,220,137,.18), rgba(141,200,241,.25)); }
.rain, .storm { background: linear-gradient(155deg, rgba(91,123,160,.24), rgba(123,164,198,.12)); }
.snow { background: linear-gradient(145deg, rgba(204,226,243,.24), rgba(153,190,219,.2)); }
.sun-glow { position: absolute; width: 150px; height: 150px; right: -40px; top: -42px; animation: sunshine 7s ease-in-out infinite alternate; }
.sun-disc { position: absolute; inset: 45px; border-radius: 50%; background: #f5cd78; box-shadow: 0 0 32px 20px rgba(250,209,126,.25); opacity: .65; }
.sun-rays { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(from 0deg, transparent 0deg 20deg, rgba(248,205,112,.22) 20deg 30deg); mask-image: radial-gradient(circle, transparent 24%, #000 45%, transparent 70%); animation: sun-turn 60s linear infinite; }
.cloud { position: absolute; width: 150px; height: 45px; border-radius: 50%; background: var(--weather-cloud, #dceaf6); filter: blur(9px); opacity: .35; animation: cloud-drift 14s ease-in-out infinite alternate; }
.cloud-one { top: 8%; left: -30px; }
.cloud-two { top: 28%; right: -60px; width: 180px; animation-delay: -7s; animation-duration: 19s; opacity: .22; }
.particle { position: absolute; top: -100%; width: 1px; height: 100%; background: linear-gradient(var(--clock-accent, #467dd2), var(--clock-accent, #467dd2)) no-repeat; background-size: 1px 12px; opacity: .2; animation: precipitation var(--duration) linear var(--delay) infinite; }
.heavy .particle { background-size: 1px 21px; opacity: .28; }
.snow .particle { width: var(--flake-size); background: radial-gradient(circle closest-side, var(--clock-ink, #467dd2) 75%, transparent) no-repeat; background-size: var(--flake-size) var(--flake-size); opacity: .2; }
.fog-bank { position: absolute; inset: 15% -35%; background: repeating-linear-gradient(0deg, transparent 0 20px, rgba(167,191,211,.25) 30px 42px, transparent 55px 65px); filter: blur(10px); animation: cloud-drift 12s ease-in-out infinite alternate; }
.lightning { position: absolute; inset: 0; background: rgba(224,235,255,.2); opacity: 0; animation: lightning 9s linear infinite; }
@keyframes precipitation { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(var(--drift), 225%, 0); } }
@keyframes cloud-drift { from { transform: translateX(-12px); } to { transform: translateX(28px); } }
@keyframes sun-turn { to { transform: rotate(360deg); } }
@keyframes sunshine { from { transform: scale(.92); opacity: .65; } to { transform: scale(1.08); opacity: 1; } }
@keyframes lightning { 0%, 88%, 91%, 94%, 100% { opacity: 0; } 89%, 92% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .weather-scene *, .weather-scene *::before, .weather-scene *::after { animation: none; }
  .particle { top: 45%; transform: rotate(15deg); }
  .particle:nth-child(3n) { top: 20%; }
  .particle:nth-child(3n + 1) { top: 75%; }
}
</style>
