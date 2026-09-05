<template>
  <Teleport to="body">
    <div
      v-if="mounted"
      ref="dialogEl"
      class="video-modal"
      :class="{ 'is-expanded': expanded }"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('videoModal.player')"
      @click.self="requestClose"
    >
      <div class="video-modal__frame" :style="frameStyle">
        <button
          ref="closeBtn"
          type="button"
          class="video-modal__close"
          :aria-label="$t('videoModal.close')"
          @click="requestClose"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>

        <div class="video-modal__player">
          <iframe
            v-if="showIframe"
            class="video-modal__iframe"
            :src="embedSrc"
            :title="$t('videoModal.youtube')"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
export interface VideoModalOrigin {
  top: number
  left: number
  width: number
  height: number
}
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    origin?: VideoModalOrigin | null
    videoId: string
    listId?: string
  }>(),
  { origin: null, listId: undefined },
)

const emit = defineEmits<{ close: [] }>()

const MARGIN = 15
const MOTION_MS = 460
const motionDuration = `${MOTION_MS}ms`

const mounted = ref(false)
const expanded = ref(false)
const showIframe = ref(false)
const dialogEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLElement | null>(null)

let leaveTimer: ReturnType<typeof setTimeout> | null = null
let iframeTimer: ReturnType<typeof setTimeout> | null = null
let rafId = 0
let scrollLockValue = ''
let previouslyFocused: HTMLElement | null = null

function prefersReducedMotion(): boolean {
  return (
    import.meta.client
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const embedSrc = computed(() => {
  const params = new URLSearchParams({ autoplay: '1', rel: '0' })
  if (props.listId) params.set('list', props.listId)
  return `https://www.youtube.com/embed/${props.videoId}?${params.toString()}`
})

const frameStyle = computed<Record<string, string>>(() => {
  if (expanded.value || !props.origin) {
    return {
      top: `${MARGIN}px`,
      left: `${MARGIN}px`,
      width: `calc(100svw - ${MARGIN * 2}px)`,
      height: `calc(100svh - ${MARGIN * 2}px)`,
    }
  }
  return {
    top: `${props.origin.top}px`,
    left: `${props.origin.left}px`,
    width: `${props.origin.width}px`,
    height: `${props.origin.height}px`,
  }
})

watch(
  () => props.open,
  open => (open ? enter() : leave()),
)

function clearTimers(): void {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  if (iframeTimer) {
    clearTimeout(iframeTimer)
    iframeTimer = null
  }
  cancelAnimationFrame(rafId)
}

function enter(): void {
  clearTimers()
  previouslyFocused
    = import.meta.client ? (document.activeElement as HTMLElement | null) : null

  mounted.value = true
  expanded.value = false
  showIframe.value = false
  lockScroll()
  void nextTick(() => closeBtn.value?.focus())

  if (prefersReducedMotion() || !props.origin) {
    expanded.value = true
    showIframe.value = true
    return
  }

  rafId = requestAnimationFrame(() => {
    rafId = requestAnimationFrame(() => {
      expanded.value = true
    })
  })
  iframeTimer = setTimeout(() => {
    if (props.open) showIframe.value = true
  }, MOTION_MS)
}

function leave(): void {
  clearTimers()
  showIframe.value = false
  expanded.value = false
  unlockScroll()
  previouslyFocused?.focus?.()
  previouslyFocused = null

  if (prefersReducedMotion() || !props.origin) {
    mounted.value = false
    return
  }

  leaveTimer = setTimeout(() => {
    mounted.value = false
    leaveTimer = null
  }, MOTION_MS)
}

function requestClose(): void {
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) emit('close')
}

function onFocusIn(event: FocusEvent): void {
  if (!props.open || !dialogEl.value) return
  if (dialogEl.value.contains(event.target as Node)) return
  closeBtn.value?.focus()
}

function lockScroll(): void {
  if (!import.meta.client) return
  scrollLockValue = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
}

function unlockScroll(): void {
  if (!import.meta.client) return
  document.documentElement.style.overflow = scrollLockValue
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('focusin', onFocusIn)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('focusin', onFocusIn)
  clearTimers()
  unlockScroll()
})
</script>

<style scoped>
.video-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgb(0 0 0 / 0%);
  transition: background-color v-bind(motionDuration) cubic-bezier(0.22, 1, 0.36, 1);
}

.video-modal.is-expanded {
  background: rgb(0 0 0 / 80%);
}

.video-modal__frame {
  position: fixed;
  overflow: hidden;
  background: #000;
  border: 1px solid #fff;
  border-radius: 14px;
  transition:
    top v-bind(motionDuration) cubic-bezier(0.22, 1, 0.36, 1),
    left v-bind(motionDuration) cubic-bezier(0.22, 1, 0.36, 1),
    width v-bind(motionDuration) cubic-bezier(0.22, 1, 0.36, 1),
    height v-bind(motionDuration) cubic-bezier(0.22, 1, 0.36, 1);
  will-change: top, left, width, height;
}

.video-modal__player {
  width: 100%;
  height: 100%;
}

.video-modal__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.video-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  appearance: none;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 50%;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    transform 200ms ease;
}

.video-modal__close:hover {
  background: rgb(0 0 0 / 70%);
  transform: rotate(90deg);
}

.video-modal__close svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

@media (prefers-reduced-motion: reduce) {
  .video-modal,
  .video-modal__frame,
  .video-modal__close {
    transition: none;
  }

  .video-modal__close:hover {
    transform: none;
  }
}
</style>
