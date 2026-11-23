// 只订阅需要的键；调用方负责在卸载时取消订阅。
export function subscribeStorage(area: 'sync' | 'local', keys: string[], callback: () => void) {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === area && keys.some(key => Object.prototype.hasOwnProperty.call(changes, key))) callback()
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
