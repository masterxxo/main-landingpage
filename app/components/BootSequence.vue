<script setup lang="ts">
const props = defineProps({
  videoSrc: { type: String, required: true },
  preload: { type: Array, default: () => [] },
  introDuration: { type: Number, default: null },
  revealDuration: { type: Number, default: 2200 },
  minBarDuration: { type: Number, default: 2000 },
  holdAfterLoad: { type: Number, default: 2000 },
})

const { phase, progress, toIntro, toReveal, toReady } = useBoot()

const videoEl = ref(null)
const displayProgress = ref(0)
const canSkip = ref(false)

let skipTimer = 0
let introTimer = 0
let revealTimer = 0
let rafId = 0
const mountedAt = performance.now();

function smoothProgress() {
  const elapsed = performance.now() - mountedAt
  const timeCap = elapsed / props.minBarDuration

  const target = Math.min(progress.value, timeCap)

  displayProgress.value += (target - displayProgress.value) * 0.08
  rafId = requestAnimationFrame(smoothProgress)
}

async function startIntro() {
  toIntro()

  await nextTick()
  const video = videoEl.value
  if (!video) return finish()

  try {
    await video.play()
  }
  catch {
    finish()
  }
}

function finish() {
  toReveal()

  if (revealTimer) clearTimeout(revealTimer)
  revealTimer = window.setTimeout(() => {
    const video = videoEl.value
    if (video) video.pause()
    toReady()
  }, props.revealDuration)
}

onMounted(async () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  rafId = requestAnimationFrame(smoothProgress)

  const assets: Array<string> = [props.videoSrc, ...props.preload] as Array<string>
  await preloadAssets(assets, v => (progress.value = v))

  const remaining = Math.max(0, props.minBarDuration - (performance.now() - mountedAt))
  await new Promise(r => setTimeout(r, remaining + props.holdAfterLoad))

  if (reduced) return finish()

  startIntro()
  skipTimer = window.setTimeout(() => (canSkip.value = true), 1000)

  if (props.introDuration) {
    introTimer = window.setTimeout(finish, props.introDuration)
  }
})

onBeforeUnmount(() => {
  clearTimeout(skipTimer)
  clearTimeout(introTimer)
  clearTimeout(revealTimer)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <Transition name="video">
    <video
      v-show="phase === 'intro' || phase === 'reveal'"
      ref="videoEl"
      class="boot-video"
      :class="{ 'is-background': phase !== 'intro' }"
      :src="videoSrc"
      muted
      playsinline
      preload="auto"
      @ended="finish"
      @error="finish"
    />
  </Transition>

  <MainLoader :display-progress="displayProgress" />
</template>

<style scoped>

.boot-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 9998;
}

.boot-video.is-background {
  z-index: 0;
}

.video-leave-active {
  transition: opacity 900ms ease;
  z-index: 0;
}

.video-leave-to {
  opacity: 0;
}

.boot-leave-active {
  transition: opacity 700ms ease;
}

.boot-leave-to {
  opacity: 0;
}
</style>