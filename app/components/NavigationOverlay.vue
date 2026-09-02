<template>
  <Transition name="layout">
    <div v-if="isHeroReady" class="fixed top-0 left-0 w-full h-[100svh] z-30 p-4 pointer-events-none">
      <div class="border border-white/20 border-opacity-20 rounded-lg w-full h-full relative">
        <div class="flex justify-between items-center w-full relative h-12.75 z-10 overflow-hidden rounded-t-lg pointer-events-auto">
          <HeaderScrollBackground />
          <button
            class="relative h-full w-16.75 flex flex-col items-center justify-center gap-1 cursor-pointer border border-transparent rounded-tl-lg hover:border-white"
            aria-label="Otwórz menu"
            :aria-expanded="isMenuOpen"
            aria-controls="mobile-navigation"
            @click="isMenuOpen = !isMenuOpen"
          >
            <div class="w-6.5 h-px bg-white"></div>
            <div class="w-5.5 h-px bg-white"></div>
          </button>
          <nav class="desktop-navigation relative flex items-center gap-3">
            <a href="#hero"><ScrambleLink text="HERO" /></a>
            <a href="#about" @click="navigateToAbout"><ScrambleLink text="ABOUT" /></a>
            <a href="#apps"><ScrambleLink text="APPS" /></a>
          </nav>
          <div class="relative">
            <a
              href="#contact"
              class="contact-btn"
              @mouseenter="contactScramble?.start()"
              @mouseleave="contactScramble?.stop()"
              @focus="contactScramble?.start()"
              @blur="contactScramble?.stop()"
            >
              <ScrambleLink
                ref="contactScramble"
                class="contact-btn__label"
                text="CONTACT"
                plain
                text-color="currentColor"
                :font-weight="600"
              />
            </a>
          </div>
          <div class="absolute w-full bg-white/20 h-px bottom-0"></div>
        </div>
        <Transition name="mobile-menu">
          <aside
            v-if="isMenuOpen"
            id="mobile-navigation"
            class="mobile-navigation"
            aria-label="Nawigacja"
          >
            <nav class="flex flex-col gap-6">
              <a href="#hero" @click="closeMenu"><ScrambleLink text="HERO" /></a>
              <a href="#about" @click="handleMobileAbout"><ScrambleLink text="ABOUT" /></a>
              <a href="#apps" @click="closeMenu"><ScrambleLink text="APPS" /></a>
            </nav>
          </aside>
        </Transition>
        <div class="absolute top-0 left-0 w-16.75 h-full border-r border-white/20 flex flex-col items-center justify-between pointer-events-auto">
          <div>
            </div>
          <div>
            </div>
          <div class="mb-6">
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
  </Transition>
</template>

<script lang="ts" setup>
import type { ScrambleTarget } from '~/composables/useScrambleReveal'

const isAudioPlaying = ref(false);
const isMenuOpen = ref(false)
const contactScramble = ref<ScrambleTarget | null>(null)
const { isHeroReady } = useBoot()

function closeMenu(): void {
  isMenuOpen.value = false
}

function handleMobileAbout(event: MouseEvent): void {
  closeMenu()
  navigateToAbout(event)
}

function navigateToAbout(event: MouseEvent): void {
  if (window.matchMedia('(max-width: 968px)').matches) return

  const section = document.getElementById('hero')
  if (!section) return

  // ABOUT is rendered inside the pinned desktop hero and has no layout box of
  // its own, so native hash navigation cannot reach the corresponding timeline
  // state. Its copy is activated just before the hero section ends.
  event.preventDefault()
  const target = section.offsetTop + section.offsetHeight - window.innerHeight * 1.2
  window.history.pushState(null, '', '#about')
  window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
}

const toggleAudioLoop = () => {
  isAudioPlaying.value = !isAudioPlaying.value
}
</script>

<style scoped>
.mobile-navigation {
  position: absolute;
  top: 51px;
  bottom: 0;
  left: 0;
  z-index: 20;
  width: min(280px, calc(100% - 32px));
  padding: 32px 24px;
  background: rgb(0 0 0 / 96%);
  border-right: 1px solid rgb(255 255 255 / 20%);
  pointer-events: auto;
}

.mobile-navigation a {
  display: block;
  width: fit-content;
  color: #fff;
}

.mobile-navigation :deep(.scramble__text),
.mobile-navigation :deep(.scramble__sizer) {
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(32px, 9vw, 52px) !important;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: transform 280ms cubic-bezier(0.65, 0, 0.35, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  transform: translateX(-100%);
}

@media (min-width: 969px) {
  .mobile-navigation {
    display: none;
  }
}

@media (max-width: 968px) {
  .desktop-navigation {
    display: none;
  }
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity 500ms ease;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
