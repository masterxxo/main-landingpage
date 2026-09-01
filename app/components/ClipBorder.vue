<template>
  <svg
    ref="root"
    class="clip-border"
    viewBox="0 0 1 1"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path ref="pathEl" :d="path" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ path: string }>()

const pathEl = ref<SVGPathElement | null>(null)
const root = ref<SVGSVGElement | null>(null)
defineExpose({ pathEl, root })
</script>

<style scoped>
.clip-border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.clip-border path {
  fill: none;
  stroke: var(--clip-border-stroke, rgb(255 255 255 / 24%));
  stroke-width: var(--clip-border-width, 1);
}
</style>
