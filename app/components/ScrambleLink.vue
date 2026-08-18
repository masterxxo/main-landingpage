<script setup lang="ts">
const props = defineProps({
  text: { type: String, required: true },
  wipeDuration: { type: Number, default: 240 },
  scrambleDuration: { type: Number, default: 240 },
  stagger: { type: Number, default: 18 },
  scrambleFps: { type: Number, default: 30 },
  charset: { type: String, default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@' },
})

const displayed = ref(props.text)
const isActive = ref(false)

let rafId = 0
let startedAt = 0
let lastFrame = 0

function randomChar() {
  return props.charset[Math.floor(Math.random() * props.charset.length)]
}

function tick() {
  const now = performance.now()
  const elapsed = now - startedAt

  const frameInterval = 1000 / props.scrambleFps

  if (now - lastFrame >= frameInterval) {
    lastFrame = now

    let out = ''
    let allResolved = true

    for (let i = 0; i < props.text.length; i++) {
      const char = props.text[i]

      if (char === ' ') {
        out += ' '
        continue
      }

      const charStart = i * props.stagger
      const charEnd = charStart + props.scrambleDuration

      if (elapsed >= charEnd) {
        out += char
      }
      else if (elapsed >= charStart) {
        out += randomChar()
        allResolved = false
      }
      else {
        out += char
        allResolved = false
      }
    }

    displayed.value = out

    if (allResolved) {
      displayed.value = props.text
      rafId = 0
      return
    }
  }

  rafId = requestAnimationFrame(tick)
}

function start() {
  isActive.value = true
  if (rafId) cancelAnimationFrame(rafId)
  startedAt = performance.now()
  lastFrame = 0
  rafId = requestAnimationFrame(tick)
}

function stop() {
  isActive.value = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  displayed.value = props.text
}

defineExpose({ start, stop })

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <span
    class="scramble"
    :class="{ 'is-active': isActive }"
    :style="{
      '--wipe-duration': `${wipeDuration}ms`,
    }"
    @mouseenter="start"
    @mouseleave="stop"
    @focusin="start"
    @focusout="stop"
  >
    <span class="scramble__wipe" aria-hidden="true" />
    <span class="scramble__text">{{ displayed }}</span>
    <span class="scramble__text scramble__text--dark" aria-hidden="true">
      {{ displayed }}
    </span>
  </span>
</template>

<style scoped>
.scramble {
  position: relative;
  display: inline-block;
  padding: 0.25em 0.5em;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.scramble__wipe {
  position: absolute;
  inset: 0;
  background: #fff;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--wipe-duration) cubic-bezier(0.65, 0, 0.35, 1);
}

.scramble.is-active .scramble__wipe {
  transform: scaleX(1);
}

.scramble__text {
  position: relative;
  z-index: 1;
  display: block;
  white-space: pre;
  color: #fff;
  text-transform: uppercase;
  font-size:14px;
  font-weight: 900;
}

.scramble__text--dark {
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: inherit;
  color: #05060a;
  /* ta sama krzywa i czas co wipe — krawędzie jadą razem */
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--wipe-duration) cubic-bezier(0.65, 0, 0.35, 1);
}

.scramble.is-active .scramble__text--dark {
  clip-path: inset(0 0 0 0);
}

@media (prefers-reduced-motion: reduce) {
  .scramble__wipe,
  .scramble__text--dark {
    transition-duration: 1ms;
  }
}
</style>