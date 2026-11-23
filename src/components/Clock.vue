<template>
  <article ref="element" class="clock-widget" :class="{ compact: width < 300, short: height > 0 && height < 195, 'clock-dark': theme.activeTheme.isDark }" :style="{ '--clock-size': Math.max(40, Math.min(88, width * .24)) + 'px' }" aria-label="时钟">
    <div class="clock-orbit" aria-hidden="true"></div>
    <header class="clock-header"><span class="clock-eyebrow"><i aria-hidden="true"></i>本地时间</span><span class="clock-greeting">{{ greeting }}</span></header>
    <div class="clock-body" tabindex="0" aria-label="时钟信息，可滚动阅读">
      <div class="clock-section">
        <time v-if="settings.settings.showClock" class="time" :datetime="time" :aria-label="time"><span>{{ hours }}</span><span class="time-colon">:</span><span>{{ minutes }}</span></time>
        <div v-if="settings.settings.showDate" class="date"><span>{{ date }}</span><span class="date-dot" aria-hidden="true">·</span><span>{{ weekday }}</span></div>
        <span class="clock-caption">把日子，过成喜欢的样子。</span>
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useElementSize } from '@/composables/useElementSize'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
const theme = useThemeStore()
const settings = useSettingsStore()
const element = ref<HTMLElement>()
const { width, height } = useElementSize(element)
const now = ref(new Date())
const hours = computed(() => String(now.value.getHours()).padStart(2, '0'))
const minutes = computed(() => String(now.value.getMinutes()).padStart(2, '0'))
const time = computed(() => hours.value + ':' + minutes.value)
const date = computed(() => now.value.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }))
const weekday = computed(() => now.value.toLocaleDateString('zh-CN', { weekday: 'long' }))
const greeting = computed(() => {
  const hour = now.value.getHours()
  return hour < 5 ? '夜深了，早点休息' : hour < 11 ? '早安，新的一天' : hour < 14 ? '午间好，稍作休息' : hour < 18 ? '午后好，慢慢来' : '晚上好，放松一下'
})
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>
<style scoped>
.clock-widget { --clock-ink: #1e3b58; --clock-muted: #7188a1; --clock-accent: #467dd2; position: relative; isolation: isolate; width: 100%; height: 100%; min-height: var(--standalone-min-height, 0px); padding: 20px 26px; border-radius: 24px; color: var(--clock-ink); display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(var(--widget-blur, 24px)); box-shadow: 0 10px 30px rgba(26,53,84,.1); }
.clock-widget::before { content: ''; position: absolute; inset: 0; z-index: -2; border-radius: inherit; background: radial-gradient(ellipse at 100% 0%, #d4e8fb, transparent 65%), linear-gradient(125deg, #f2f7fd, #e5edf6); opacity: var(--widget-opacity, .85); }
.clock-orbit { position: absolute; z-index: -1; width: 230px; height: 230px; right: -90px; top: -120px; border: 1px solid rgba(101,153,205,.15); border-radius: 50%; box-shadow: 0 0 0 26px rgba(127,169,211,.035), 0 0 0 52px rgba(127,169,211,.025); pointer-events: none; }
.clock-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px 12px; flex-shrink: 0; }
.clock-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10px; letter-spacing: 2px; color: var(--clock-muted); }
.clock-eyebrow i { width: 5px; height: 5px; border-radius: 50%; background: var(--clock-accent); }
.clock-greeting { font-size: 10px; letter-spacing: 1px; color: var(--clock-muted); }
.clock-body { display: flex; flex: 1; min-width: 0; min-height: 0; padding-top: 0; overflow: auto; scrollbar-width: thin; }
.clock-section { min-width: max-content; margin-block: auto; display: flex; flex-direction: column; }
.time { display: flex; align-items: baseline; font-size: var(--clock-size, 72px); line-height: 1.05; font-weight: 300; letter-spacing: -4px; font-variant-numeric: tabular-nums; font-family: 'Segoe UI', 'Helvetica Neue', sans-serif; }
.time-colon { font-size: .65em; padding: 0 7px; color: var(--clock-accent); transform: translateY(-.08em); font-weight: 300; }
.date { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; font-size: 12px; margin-top: 12px; color: var(--clock-muted); }
.date-dot { opacity: .5; }
.clock-caption { display: block; margin-top: 17px; color: var(--clock-muted); font-size: 10px; letter-spacing: 1px; opacity: .8; }
.clock-dark { --clock-ink: #e3edf9; --clock-muted: #94abc4; --clock-accent: #91b9f5; }
.clock-dark::before { background: radial-gradient(ellipse at 100% 0%, #284565, transparent 70%), linear-gradient(125deg, #192b43, #21364f); }
.compact { padding: 18px 20px; }
.compact .clock-caption { display: none; }
.compact .clock-greeting { font-size: 9px; letter-spacing: 0; }
.short { padding: 14px 20px; }
.short .clock-caption { display: none; }
.short .date { margin-top: 6px; }
.compact .time { font-size: min(var(--clock-size), 56px); letter-spacing: -3px; }
.compact .time-colon { padding: 0 3px; }
.compact .date { font-size: 10px; gap: 4px; }
</style>
