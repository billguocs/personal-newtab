<template>
  <ModalDialog title="配置备份与同步" @close="!busy && emit('close')">
    <section class="config-transfer">
      <header><h2>配置备份与同步</h2><button :disabled="busy" aria-label="关闭" @click="emit('close')">✕</button></header>
      <p>在不同机器使用同一 Google 账号并开启 Chrome 同步，即可同步布局、导航、主题和基础设置。</p>
      <p class="extension-id">扩展 ID：<code>{{ extensionId }}</code></p>
      <p>备份还包含本机壁纸和雪球自选股，可用于迁移旧版配置。天气位置需在新机器重新设置。</p>
      <div class="actions"><button :disabled="busy" @click="exportBackup">导出配置</button><label :class="{ disabled: busy }">选择备份文件<input type="file" accept=".json,application/json" :disabled="busy" @change="selectBackup" /></label></div>
      <div v-if="pending" class="import-preview"><p>待导入：{{ Object.keys(pending.sync).length }} 项同步配置、{{ Object.keys(pending.local).length }} 项本机配置。</p><p>确认后覆盖对应配置，并先下载一份当前配置备份。</p><button :disabled="busy" @click="restore">{{ busy ? '恢复中…' : '导入并覆盖配置' }}</button></div>
      <p v-if="message" role="status" :class="{ error: hasError }">{{ message }}</p>
    </section>
  </ModalDialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ModalDialog from './ModalDialog.vue'
import { exportConfigBackup, importConfigBackup, downloadConfigBackup, parseConfigBackup } from '@/utils/configBackup'
import type { ConfigBackup } from '@/utils/configBackup'
const emit = defineEmits<{ close: [] }>()
const extensionId = chrome.runtime.id
const pending = ref<ConfigBackup | null>(null)
const busy = ref(false), message = ref(''), hasError = ref(false)
function failure(error: unknown) { hasError.value = true; message.value = error instanceof Error ? error.message : '操作失败，请重试' }
async function exportBackup() {
  busy.value = true; hasError.value = false
  try { downloadConfigBackup(await exportConfigBackup()); message.value = '已导出配置，请妥善保存备份文件' } catch (error) { failure(error) } finally { busy.value = false }
}
async function selectBackup(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  pending.value = null; message.value = ''; hasError.value = false
  if (!file) return
  busy.value = true
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('备份文件不能超过 20MB')
    pending.value = parseConfigBackup(JSON.parse(await file.text()))
  } catch (error) { failure(error) } finally { busy.value = false; input.value = '' }
}
async function restore() {
  if (!pending.value || busy.value) return
  busy.value = true; hasError.value = false
  try {
    downloadConfigBackup(await exportConfigBackup())
    await importConfigBackup(pending.value)
    location.reload()
  } catch (error) { failure(error); busy.value = false }
}
</script>
<style scoped>
.config-transfer { padding: 24px; color: var(--text-primary); }
header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
h2 { font-size: 18px; font-weight: 600; }
p { font-size: 13px; line-height: 1.8; margin: 12px 0; color: var(--text-secondary); }
.extension-id { overflow-wrap: anywhere; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
button, label { display: inline-block; padding: 9px 14px; border-radius: 9px; background: var(--row-hover); color: var(--text-primary); cursor: pointer; font-size: 13px; }
button:disabled, .disabled { opacity: .5; cursor: default; }
input { display: none; }
.import-preview { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--border-color); }
.import-preview button { background: var(--accent-color); color: white; }
.error { color: #dc2626; }
</style>
