<template>
  <div ref="root" class="media-placeholder">
    <img
      v-if="image"
      class="media-placeholder__image"
      :src="image"
      alt=""
    >
    <ClipBorder :path="path" />
    <span class="media-placeholder__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
// Zaślepka kadru: przyciemnione pole przycięte wspólnym kształtem, z obrysem
// i etykietą. Pozycję i rozmiar nadaje rodzic (klasa) — komponent odpowiada
// tylko za wygląd „ramki na obrazek".
const props = defineProps<{
  /** id elementu <clipPath> zdefiniowanego przez rodzica. */
  clipId: string
  /** Ścieżka `d` obrysu — ta sama geometria co clipPath. */
  path: string
  label: string
  image?: string
}>()

// Trzymamy clip-path w arkuszu (przez v-bind), nie w inline :style — inaczej
// GSAP `clearProps` na tym elemencie potrafi go zdjąć.
const clipUrl = computed(() => `url("#${props.clipId}")`)

const root = ref<HTMLElement | null>(null)
defineExpose({ root })
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
}

.media-placeholder__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% center;
}
</style>
