<script setup lang="ts">
import { gsap } from 'gsap'

const props = defineProps({
  videoSrc: { type: String, required: true },
  preload: { type: Array, default: () => [] },
  introDuration: { type: Number, default: null },
  revealDuration: { type: Number, default: 2200 },
  minBarDuration: { type: Number, default: 2000 },
  holdAfterLoad: { type: Number, default: 2000 },
})

const { phase, progress, toIntro, toReveal, toReady } = useBoot()

const videoEl = ref<HTMLVideoElement | null>(null)
const displayProgress = ref(0)

let introCall: gsap.core.Tween | null = null
let revealCall: gsap.core.Tween | null = null
let holdCall: gsap.core.Tween | null = null
let progressTween: gsap.core.Tween | null = null

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
  introCall?.kill()
  toReveal()

  revealCall?.kill()
  revealCall = gsap.delayedCall(props.revealDuration / 1000, () => {
    videoEl.value?.pause()
    toReady()
  })
}

onMounted(async () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mountedAt = performance.now()
  const progressCap = { value: 0 }

  progressTween = gsap.to(progressCap, {
    value: 1,
    duration: props.minBarDuration / 1000,
    ease: 'none',
    onUpdate: () => {
      displayProgress.value = Math.min(progress.value, progressCap.value)
    },
  })

  const assets: Array<string> = [props.videoSrc, ...props.preload] as Array<string>
  await preloadAssets(assets, (value) => {
    progress.value = value
    displayProgress.value = Math.min(value, progressCap.value)
  })

  const remaining = Math.max(0, props.minBarDuration - (performance.now() - mountedAt))
  await new Promise<void>((resolve) => {
    holdCall = gsap.delayedCall((remaining + props.holdAfterLoad) / 1000, resolve)
  })

  if (reduced) return finish()

  startIntro()

  if (props.introDuration) {
    introCall = gsap.delayedCall(props.introDuration / 1000, finish)
  }
})

onBeforeUnmount(() => {
  progressTween?.kill()
  holdCall?.kill()
  introCall?.kill()
  revealCall?.kill()
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
