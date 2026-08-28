<template>
  <div
    class="header-scroll-background"
    :style="{ transform: `scaleX(${scrollProgress})` }"
    aria-hidden="true"
  ></div>
</template>

<script setup lang="ts">
const scrollProgress = ref(0)

let animationFrame: number | null = null

function updateScrollProgress(): void {
  animationFrame = null

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = scrollableHeight > 0
    ? Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1)
    : 0
}

function scheduleUpdate(): void {
  if (animationFrame !== null) return
  animationFrame = window.requestAnimationFrame(updateScrollProgress)
}

onMounted(() => {
  updateScrollProgress()
  window.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)

  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.header-scroll-background {
  position: absolute;
  inset: 0;
  background: rgb(255 255 255 / 8%);
  pointer-events: none;
  transform-origin: left center;
}
</style>
