<script setup lang="ts">
interface ScrambleLinkProps {
  text: string
  wipeDuration?: number
  scrambleDuration?: number
  stagger?: number
  scrambleFps?: number
  charset?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  textColor?: string
  hover?: boolean
  plain?: boolean
  sequential?: boolean
}

const props = withDefaults(defineProps<ScrambleLinkProps>(), {
  wipeDuration: 240,
  scrambleDuration: 240,
  stagger: 18,
  scrambleFps: 30,
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@',
  fontSize: 14,
  fontFamily: 'inherit',
  fontWeight: 900,
  textColor: '#fff',
  hover: true,
  plain: false,
  sequential: false,
})

const displayed = ref(props.text)
const isActive = ref(false)
const animatedCharacterCount = computed<number>(
  () => [...props.text].filter((char: string) => char !== ' ').length,
)

let rafId = 0
let startedAt = 0
let lastFrame = 0

function randomChar(): string {
  return props.charset[Math.floor(Math.random() * props.charset.length)] ?? ''
}

function buildSequentialText(elapsed: number): { text: string, complete: boolean } {
  const activeStep = Math.floor(elapsed / props.scrambleDuration)

  if (activeStep >= animatedCharacterCount.value) {
    return { text: props.text, complete: true }
  }

  let text = ''
  let sequenceStep = 0

  for (let index = 0; index < props.text.length; index++) {
    const char = props.text[index] ?? ''

    if (char === ' ') text += ' '
    else {
      if (sequenceStep < activeStep) text += char
      else if (sequenceStep === activeStep) text += randomChar()
      else text += ' '

      sequenceStep += 1
    }
  }

  return { text, complete: false }
}

function tick(): void {
  const now = performance.now()
  const elapsed = now - startedAt

  const frameInterval = 1000 / props.scrambleFps

  if (now - lastFrame >= frameInterval) {
    lastFrame = now

    if (props.sequential) {
      const frame = buildSequentialText(elapsed)
      displayed.value = frame.text

      if (frame.complete) {
        rafId = 0
        return
      }

      rafId = requestAnimationFrame(tick)
      return
    }

    let nextText = ''
    let allResolved = true

    for (let characterIndex = 0; characterIndex < props.text.length; characterIndex++) {
      const char = props.text[characterIndex]

      if (char === ' ') {
        nextText += ' '
        continue
      }

      const charStart = characterIndex * props.stagger
      const charEnd = charStart + props.scrambleDuration

      if (elapsed >= charEnd) {
        nextText += char
      }
      else if (elapsed >= charStart) {
        nextText += randomChar()
        allResolved = false
      }
      else {
        nextText += char
        allResolved = false
      }
    }

    displayed.value = nextText

    if (allResolved) {
      displayed.value = props.text
      rafId = 0
      return
    }
  }

  rafId = requestAnimationFrame(tick)
}

function start(): void {
  if (rafId) cancelAnimationFrame(rafId)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    isActive.value = true
    displayed.value = props.text
    rafId = 0
    return
  }

  if (props.sequential) displayed.value = props.text.replace(/\S/g, ' ')

  isActive.value = true
  startedAt = performance.now()
  lastFrame = 0
  rafId = requestAnimationFrame(tick)
}

function stop(): void {
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
    :class="{
      'is-active': isActive,
      'is-interactive': hover,
      'is-sequential': sequential,
    }"
    :style="{
      '--wipe-duration': `${wipeDuration}ms`,
      '--font-size': `${fontSize}px`,
      '--font-family': fontFamily,
      '--font-weight': fontWeight,
      '--text-color': textColor,
    }"
    @mouseenter="hover && start()"
    @mouseleave="hover && stop()"
    @focusin="hover && start()"
    @focusout="hover && stop()"
  >
    <span v-if="!plain" class="scramble__wipe" aria-hidden="true" />
    <span v-if="sequential" class="scramble__sizer" aria-hidden="true">
      {{ text }}
    </span>
    <span class="scramble__text">{{ displayed }}</span>
    <span v-if="!plain" class="scramble__text scramble__text--dark" aria-hidden="true">
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

.scramble:not(.is-interactive):not(.is-active) {
  visibility: hidden;
}

.scramble.is-sequential {
  display: inline-grid;
}

.scramble.is-sequential .scramble__sizer,
.scramble.is-sequential .scramble__text {
  grid-area: 1 / 1;
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

.scramble__text,
.scramble__sizer {
  display: block;
  white-space: pre;
  text-transform: uppercase;
  font-family: var(--font-family);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
}

.scramble__text {
  position: relative;
  z-index: 1;
  color: var(--text-color);
}

.scramble__sizer {
  visibility: hidden;
}

.scramble__text--dark {
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: inherit;
  color: #05060a;
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
