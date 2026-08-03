<template>
  <div class="fixed top-0 left-0 w-full h-screen z-30 p-4">
    <div class="border border-white/20 border-opacity-20 rounded-lg w-full h-full relative">
      <div class="flex justify-between items-center w-full relative h-12.75 z-10">
        <button class="h-full w-16.75 flex flex-col items-center justify-center gap-1 cursor-pointer border border-transparent rounded-tl-lg hover:border-white">
          <div class="w-6.5 h-px bg-white"></div>
          <div class="w-5.5 h-px bg-white"></div>
        </button>
        <nav>
          <a>Apps</a>
          <a>About</a>
          <a>Contact</a>
        </nav>
        <div>
          <button class="contact-btn">CONTACT</button>
        </div>
        <div class="absolute w-full bg-white/20 h-px bottom-0"></div>
      </div>
      <div class="absolute top-0 left-0 w-16.75 h-full border-r border-white/20 flex flex-col items-center justify-between">
        <div>
          <!-- Placeholder -->
        </div>
        <div>
          <!-- Image -->
        </div>
        <div class="mb-6">
          <!-- Sound BTN -->
          <button class="flex items-center space-x-0.5 cursor-pointer" @click="toggleAudioLoop">
            <audio class="hidden"></audio>
            <div
              class="indicator-line"
              :class="isAudioPlaying ? 'active':''"
              style="animation-delay:0.1s;"
            ></div>
            <div
              class="indicator-line"
              :class="isAudioPlaying ? 'active':''"
              style="animation-delay:0.2s;"
            ></div>
            <div
              class="indicator-line"
              :class="isAudioPlaying ? 'active':''"
              style="animation-delay:0.3s;"
            ></div>
            <div
              class="indicator-line"
              :class="isAudioPlaying ? 'active':''"
              style="animation-delay:0.4s;"
            ></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const isAudioPlaying = ref(false);

const toggleAudioLoop = () => {
  isAudioPlaying.value = !isAudioPlaying.value
}
</script>