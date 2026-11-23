<template>
  <article ref="element" class="poetry-widget" :class="{ compact: width < 260, short: height < 190 }" aria-label="每日诗词 · 线装诗笺">
    <div class="book-art" aria-hidden="true">
      <div class="book-cover"></div>
      <div class="book-pages"></div>
      <div class="book-paper"></div>
    </div>
    <div class="book-binding" aria-hidden="true">
      <svg v-for="i in 4" :key="i" viewBox="0 0 28 28" fill="none">
        <circle cx="22" cy="5" r="2.2" fill="#132b3b" /><circle cx="22" cy="23" r="2.2" fill="#132b3b" />
        <path d="M22 5H4v18h18M4 5l18 18M4 23 22 5" stroke="#d6c6a5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="book-sheet">
      <header class="book-heading"><span>一日一诗</span><span aria-hidden="true">拾 · 光</span></header>
      <div v-if="poetryStore.loading" class="book-state" role="status">展卷中…</div>
      <div v-else-if="poetryStore.error" class="book-state" role="status"><p>{{ poetryStore.error }}</p><button @click="poetryStore.loadPoetry()">重新展卷</button></div>
      <div v-else-if="poetryStore.currentPoetry" class="poetry-content">
        <div class="poetry-meta">
          <span class="poetry-title" :title="poetryStore.currentPoetry.title">{{ poetryStore.currentPoetry.title }}</span>
          <span class="poetry-author" :title="poetryStore.currentPoetry.author">{{ poetryStore.currentPoetry.author }}</span>
        </div>
        <div class="verse-scroll" tabindex="0" aria-label="诗词正文，可滚动阅读">
          <p class="poetry-text">{{ poetryStore.currentPoetry.content }}</p>
        </div>
      </div>
      <div v-else class="book-state">今日诗笺，静候展开</div>
      <footer class="book-footer"><span>闲读片刻 · 心有山川</span><span class="poetry-seal" aria-hidden="true">诗</span></footer>
    </div>
  </article>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePoetryStore } from '@/stores/poetry'
import { useElementSize } from '@/composables/useElementSize'
const poetryStore = usePoetryStore()
const element = ref<HTMLElement>()
const { width, height } = useElementSize(element)
onMounted(() => poetryStore.loadPoetry())
</script>
<style scoped>
.poetry-widget { position: relative; isolation: isolate; width: 100%; height: 100%; min-height: 0; padding: 10px 12px 14px 32px; color: #443b2e; font-family: 'STXingkai', '华文行楷', 'KaiTi', '楷体', 'Noto Serif SC', serif; }
.book-art { position: absolute; inset: 0; isolation: isolate; z-index: -1; pointer-events: none; opacity: var(--widget-opacity, .85); }
.book-cover { position: absolute; inset: 2px 5px 5px 0; z-index: -3; border-radius: 3px 6px 6px 3px; background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.025) 3px 4px), linear-gradient(110deg, #193649, #2c4656); box-shadow: 0 8px 18px rgba(17,32,39,.22); opacity: 1; }
.book-pages { position: absolute; inset: 12px 9px 10px 26px; z-index: -2; background: repeating-linear-gradient(0deg, #e4dac0 0 1px, #c7b996 1px 2px, #f3ead5 2px 4px); border-radius: 1px 3px 3px 1px; box-shadow: 2px 2px 0 #cdc0a0, 3px 4px 0 #f0e6ce; opacity: 1; }
.book-binding { position: absolute; left: 0; top: 17px; bottom: 19px; width: 29px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.book-binding svg { width: 28px; height: 28px; flex-shrink: 0; }
.book-sheet { position: relative; isolation: isolate; height: 100%; padding: 10px 12px 8px; display: flex; flex-direction: column; min-width: 0; }
.book-paper { position: absolute; inset: 10px 12px 14px 32px; z-index: -1; background: repeating-linear-gradient(97deg, transparent 0 7px, rgba(124,99,58,.035) 7px 8px, transparent 8px 13px), radial-gradient(ellipse at 20% 10%, #fbf5e5, #e9ddbf); border: 1px solid #d6c7a5; opacity: 1; }
.book-heading { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(126,98,55,.3); padding-bottom: 7px; color: #8d7855; font-size: 10px; letter-spacing: 3px; flex-shrink: 0; }
.poetry-content { flex: 1; min-height: 0; display: flex; flex-direction: row-reverse; gap: 14px; padding: 12px 0 6px; }
.poetry-meta { display: flex; flex-direction: column; writing-mode: vertical-rl; gap: 7px; flex-shrink: 0; max-width: 56px; overflow: hidden; }
.poetry-title { font-size: 16px; letter-spacing: 2px; font-weight: 600; }
.poetry-author { color: #8d7855; font-size: 14px; letter-spacing: 2px; }
.verse-scroll { flex: 1; min-width: 0; display: flex; flex-direction: row-reverse; overflow: auto; scrollbar-width: thin; scrollbar-color: #beab85 transparent; }
.poetry-text { flex-shrink: 0; margin: 0; height: 100%; writing-mode: vertical-rl; text-orientation: mixed; white-space: pre-wrap; font-size: 20px; line-height: 1.85; letter-spacing: 3px; }
.book-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-shrink: 0; font-size: 9px; color: #9a8868; letter-spacing: 1px; }
.poetry-seal { display: inline-flex; align-items: center; justify-content: center; width: 21px; height: 23px; border: 1px solid #a34b3d; border-radius: 2px; color: #a34b3d; font-size: 14px; transform: rotate(-6deg); }
.book-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #8d7855; }
.book-state button { border-bottom: 1px solid currentColor; }
.compact { padding-left: 28px; padding-right: 9px; }
.compact .book-sheet { padding: 8px; }
.compact .book-paper { left: 28px; right: 9px; }
.compact .poetry-content { gap: 8px; }
.compact .poetry-text { font-size: 18px; letter-spacing: 2px; }
.compact .book-footer > span:first-child { display: none; }
.compact .book-footer { justify-content: flex-end; }
.short .book-heading { padding-bottom: 4px; font-size: 9px; }
.short .poetry-content { padding-top: 6px; }
.short .poetry-text { font-size: 16px; letter-spacing: 1px; }
.short .book-footer { display: none; }
</style>
