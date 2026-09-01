<template>
  <div ref="root" class="media-placeholder">
    <img
      v-if="image"
      class="media-placeholder__image"
      :src="image"
      alt=""
    >
    <button
      v-if="playOverlay"
      type="button"
      class="media-placeholder__overlay"
      aria-label="Odtwórz wideo"
      @click="emitOpen"
    >
      <span class="media-placeholder__play" aria-hidden="true">
        <svg class="media-placeholder__play-icon" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
    <ClipBorder :path="path" />
    <span class="media-placeholder__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  clipId: string
  path: string
  label: string
  image?: string
  playOverlay?: boolean
}>()

const emit = defineEmits<{ open: [origin: DOMRect] }>()

const clipUrl = computed(() => `url("#${props.clipId}")`)

const root = ref<HTMLElement | null>(null)
defineExpose({ root })

function emitOpen(): void {
  if (root.value) emit('open', root.value.getBoundingClientRect())
}
</script>

<style scoped>
.media-placeholder {
  position: absolute;
  z-index: 2;
  overflow: hidden;
  background: #161820;
  color: rgb(255 255 255 / 55%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  clip-path: v-bind(clipUrl);
}

.media-placeholder__label {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 1;
  pointer-events: none; }

.media-placeholder__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% center;
}

.media-placeholder__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0;
  appearance: none;
  background: rgb(0 0 0 / 60%);
  cursor: pointer;
  transition: background-color 400ms ease;
}

.media-placeholder__overlay:hover {
  background: rgb(0 0 0 / 45%);
}

.media-placeholder__play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 50%;
  color: #fff;
  transition: transform 600ms ease;
}

.media-placeholder__overlay:hover .media-placeholder__play {
  transform: rotate(360deg);
}

.media-placeholder__play-icon {
  width: 20px;
  height: 20px;
  margin-left: 3px; fill: currentColor;
}

@media (prefers-reduced-motion: reduce) {
  .media-placeholder__overlay,
  .media-placeholder__play {
    transition: none;
  }

  .media-placeholder__overlay:hover .media-placeholder__play {
    transform: none;
  }
}
</style>
