<template>
  <p class="writer-text" :aria-label="text">
    <span aria-hidden="true">{{ writtenText }}</span>
    <span v-if="isWriting" class="writer-text__caret" aria-hidden="true" />
  </p>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  active: boolean
  msPerCharacter?: number
}>(), {
  msPerCharacter: 28,
})

const { writtenText, isWriting } = useTextWriter(
  props.text,
  () => props.active,
  { msPerCharacter: props.msPerCharacter },
)
</script>

<style scoped>
.writer-text {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.writer-text__caret {
  display: inline-block;
  width: 1px;
  height: 0.9em;
  margin-left: 2px;
  background: currentColor;
  vertical-align: -0.08em;
  animation: writer-caret 700ms steps(1, end) infinite;
}

@keyframes writer-caret {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .writer-text__caret {
    animation: none;
  }
}
</style>
