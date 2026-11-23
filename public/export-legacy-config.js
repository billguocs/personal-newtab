// 在旧版扩展的新标签页开发者工具 Console 中执行；只导出配置，不修改原数据。
;(async () => {
  const syncKeys = ['layout', 'settings', 'navigationLinks', 'currentTheme', 'extractedThemes', 'appearanceVersion']
  const localKeys = ['customWallpaper', 'xueqiuWatchlist']
  const [sync, local] = await Promise.all([chrome.storage.sync.get(syncKeys), chrome.storage.local.get(localKeys)])
  const backup = { app: 'personal-newtab', version: 1, exportedAt: new Date().toISOString(), sync, local }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `personal-newtab-legacy-${Date.now()}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  console.log('配置已导出，请确认下载完成后再更新扩展。')
})().catch(error => console.error('导出失败，未修改原数据：', error))
