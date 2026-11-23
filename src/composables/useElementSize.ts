import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

// 按组件实际尺寸适配，而非依赖整页断点，拖拽缩放后也能正确排版。
export function useElementSize(element: Ref<HTMLElement | undefined>) {
  const width = ref(0)
  const height = ref(0)
  let observer: ResizeObserver | undefined
  onMounted(() => {
    if (!element.value) return
    width.value = element.value.clientWidth
    height.value = element.value.clientHeight
    observer = new ResizeObserver(() => {
      if (!element.value) return
      width.value = element.value.clientWidth
      height.value = element.value.clientHeight
    })
    observer.observe(element.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return { width, height }
}
