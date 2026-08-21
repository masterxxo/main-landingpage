<template>
  <div class="relative overflow-hidden h-screen w-full">
    <HeroParallax image="/img/hero_1.png" depth-map="/img/hero-depth-12.png" :active="isRevealed">
      <h1>Test text</h1>
    </HeroParallax>
    <img src="/img/hero_1.png" class="min-h-screen max-w-max" />
  </div>
</template>
<script setup lang="ts">
const { isRevealed } = useBoot();
</script>