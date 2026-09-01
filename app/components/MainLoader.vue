<template>
  <Transition name="boot">
    <div class="boot" v-if="phase === 'loading'">
      <div class="boot__loader">
        <div class="boot__bar">
          <div class="boot__fill" :style="{ transform: `scaleX(${displayProgress})` }" />
        </div>

        <div class="boot__meta">
          <span class="boot__pct">LOADING: {{ percent }}%</span>
          <span class="boot__log">{{ logLines[currentLine] }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
const props = defineProps({
  displayProgress: { type: Number, default: 0 },
  logLines: {
    type: Array,
    default: () => [
      'INITIALIZING RENDER PIPELINE',
      'COMPILING SHADERS',
      'LOADING DEPTH MAPS',
      'ESTABLISHING UPLINK',
      'CALIBRATING NEURAL INTERFACE',
      'SYSTEM READY',
    ],
  },
});

const { phase } = useBoot()

const percent = computed(() => Math.round(props.displayProgress * 100))

const currentLine = computed(() => {
  const lineIndex = Math.floor(props.displayProgress * props.logLines.length);
  return Math.min(lineIndex, props.logLines.length - 1);
});
</script>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #05060a;
  display: grid;
  place-items: center;
}

.boot__loader {
  width: 75vw;
}

.boot__bar {
  height: 2px;
  background: rgb(255 255 255 / 0.12);
  overflow: hidden;
}

.boot__fill {
  height: 100%;
  background: #fff;
  transform: scaleX(0);
  transform-origin: left;
}

.boot__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(255 255 255 / 0.55);
  font-variant-numeric: tabular-nums;
}

.boot__skip:hover {
  background: #fff;
  color: #05060a;
}

.boot-leave-active {
  transition: opacity 700ms ease;
}

.boot-leave-to {
  opacity: 0;
}
</style>
