<template>
  <div class="relative h-screen w-full overflow-hidden">
    <HeroParallax
      image="/img/hero_1.png"
      depth-map="/img/hero-depth-12.png"
      :active="isRevealed"
      @revealed="showLabels = true"
    />

    <div v-if="showLabels" class="hero-labels">
      <div
        v-for="(label, index) in labels"
        :key="label.text"
        class="hero-label"
      >
        <span class="hero-label__index">{{ label.index }}</span>
        <ScrambleLink
          :ref="instance => setLabelRef(index, instance)"
          :text="label.text"
          :font-size="140"
          font-family="Cabinet Grotesk"
          :hover="false"
          plain
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScrambleTarget } from '~/composables/useScrambleReveal'

interface HeroLabel {
  index: string
  text: string
}

const labels: HeroLabel[] = [
  { index: '01R', text: 'LEARN.' },
  { index: '02O', text: 'CREATE.' },
  { index: '03G', text: 'BE CURIOUS.' },
]

const { isRevealed } = useBoot()
const showLabels = ref<boolean>(false)
const labelRefs = useScrambleRevealGroup(labels.length, { gap: 180 })

function setLabelRef(index: number, instance: unknown): void {
  const labelRef = labelRefs[index]
  if (labelRef) labelRef.value = instance as ScrambleTarget | null
}
</script>

<style scoped>
.hero-labels {
  position: absolute;
  bottom: 80px;
  right: 130px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.hero-label {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.hero-label:not(:last-child) {
  margin-bottom: -15px;
}

.hero-label:first-child {
  margin-right: 35%;
}

.hero-label:last-child {
  margin-right: 40%;
}

.hero-label__index {
  color: #fff;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
}

.hero-labels :deep(.scramble) {
  padding: 0;
}

.hero-labels :deep(.scramble__text) {
  line-height: 1;
}
</style>
