<template>
  <Transition name="layout">
    <div v-if="isHeroReady" class="fixed top-0 left-0 w-full h-[100svh] z-30 p-4 pointer-events-none">
      <div class="border border-white/20 border-opacity-20 rounded-lg w-full h-full relative">
        <div class="flex justify-between items-center w-full relative h-12.75 z-10 overflow-hidden rounded-t-lg pointer-events-auto">
          <HeaderScrollBackground />
          <button
            class="relative h-full w-16.75 flex flex-col items-center justify-center gap-1 cursor-pointer border border-transparent rounded-tl-lg hover:border-white"
            :aria-label="isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'"
            :aria-expanded="isMenuOpen"
            aria-controls="mobile-navigation"
            @click="isMenuOpen ? closeMenu() : isMenuOpen = true"
          >
            <div class="menu-icon__line menu-icon__line--top w-6.5 h-px bg-white"></div>
            <div class="menu-icon__line menu-icon__line--bottom w-5.5 h-px bg-white"></div>
          </button>
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
            <div class="mobile-navigation__group">
              <span class="mobile-navigation__eyebrow">■ MENU</span>
              <nav class="mobile-navigation__links">
              <a href="#hero" class="mobile-navigation__item" :class="{ 'is-active': activeSection === 'hero' }" @click="closeMenu"><span class="mobile-navigation__index">001</span><ScrambleLink :ref="el => setMobileScramble(el, 0)" text="HERO" plain sequential :text-color="activeSection === 'hero' ? '#05060a' : '#fff'" /></a>
              <a href="#about" class="mobile-navigation__item" :class="{ 'is-active': activeSection === 'about' }" @click="handleMobileAbout"><span class="mobile-navigation__index">002</span><ScrambleLink :ref="el => setMobileScramble(el, 1)" text="ABOUT" plain sequential :text-color="activeSection === 'about' ? '#05060a' : '#fff'" /></a>
              <a href="#apps" class="mobile-navigation__item" :class="{ 'is-active': activeSection === 'apps' }" @click="closeMenu"><span class="mobile-navigation__index">003</span><ScrambleLink :ref="el => setMobileScramble(el, 2)" text="APPS" plain sequential :text-color="activeSection === 'apps' ? '#05060a' : '#fff'" /></a>
              </nav>
            </div>
            <div class="mobile-navigation__connect">
              <span class="mobile-navigation__eyebrow">■ CONNECT</span>
              <div class="mobile-navigation__connect-links">
                <a :href="CONTACT_LINKS.email.href">E-MAIL</a>
                <a :href="CONTACT_LINKS.x.href" target="_blank" rel="noopener noreferrer">X</a>
              </div>
            </div>
            <div class="mobile-navigation__audio">
              <button class="mobile-navigation__audio-button" type="button" :aria-pressed="isAudioPlaying" :aria-label="`Audio ${isAudioPlaying ? 'off' : 'on'}`" @click="toggleAudioLoop">
                <span class="mobile-navigation__audio-icon" aria-hidden="true">
                  <span v-for="index in 4" :key="index" class="indicator-line" :class="isAudioPlaying ? 'active' : ''" :style="{ animationDelay: `${index * 0.1}s` }" />
                </span>
                <span class="mobile-navigation__audio-label">AUDIO {{ isAudioPlaying ? 'OFF' : 'ON' }}</span>
              </button>
            </div>
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
              <span class="rail-audio-icon" aria-hidden="true">
                <span v-for="index in 4" :key="index" class="indicator-line" :class="isAudioPlaying ? 'active' : ''" :style="{ animationDelay: `${index * 0.1}s` }" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import type { ScrambleTarget } from '~/composables/useScrambleReveal'
import { CONTACT_LINKS } from '~/constants/contact'

const isAudioPlaying = ref(false);
const isMenuOpen = ref(false)
const activeSection = ref<'hero' | 'about' | 'apps'>('hero')
const mobileScrambles = ref<ScrambleTarget[]>([])
let scrambleTimers: number[] = []
const contactScramble = ref<ScrambleTarget | null>(null)
const { isHeroReady } = useBoot()

function closeMenu(): void {
  isMenuOpen.value = false
  scrambleTimers.forEach(timer => window.clearTimeout(timer))
  scrambleTimers = []
}

function setMobileScramble(element: unknown, index: number): void {
  if (element && typeof element === 'object' && 'start' in element) {
    mobileScrambles.value[index] = element as ScrambleTarget
  }
}

watch(isMenuOpen, async (open) => {
  if (!open) return
  await nextTick()
  scrambleTimers = []
  mobileScrambles.value.forEach((target, index) => {
    scrambleTimers.push(window.setTimeout(() => target?.start(), 120 + index * 140))
  })
})

function updateActiveSection(): void {
  const viewportMiddle = window.innerHeight * 0.45
  const hero = document.getElementById('hero')
  const about = document.getElementById('about')
  const apps = document.getElementById('apps')

  if (apps && apps.getBoundingClientRect().top <= viewportMiddle) {
    activeSection.value = 'apps'
    return
  }

  if (about) {
    const aboutRect = about.getBoundingClientRect()
    if (aboutRect.height > 0 && aboutRect.top <= viewportMiddle && aboutRect.bottom > viewportMiddle) {
      activeSection.value = 'about'
      return
    }

    // On desktop ABOUT uses `display: contents`; use the hero's remaining
    // scroll range as its visual boundary instead.
    if (aboutRect.height === 0 && hero) {
      const heroBottom = hero.getBoundingClientRect().bottom
      if (heroBottom <= window.innerHeight * 1.8) {
        activeSection.value = 'about'
        return
      }
    }
  }

  if (hero) activeSection.value = 'hero'
}

onMounted(() => {
  updateActiveSection()
  window.addEventListener('scroll', updateActiveSection, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveSection)
  scrambleTimers.forEach(timer => window.clearTimeout(timer))
})

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
  width: min(360px, calc(100% - 32px));
  padding: 42px 28px 28px;
  background: rgb(0 0 0 / 96%);
  border-right: 1px solid rgb(255 255 255 / 20%);
  border-bottom-left-radius: 8px;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  transform-origin: left center;
}

.mobile-navigation__eyebrow {
  display: block;
  color: #fff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.mobile-navigation__group,
.mobile-navigation__connect {
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

.mobile-navigation__links {
  display: flex;
  flex-direction: column;
  gap: clamp(28px, 5vh, 52px);
}

.mobile-navigation__item {
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding: 8px 12px;
  margin: -8px -12px;
  width: fit-content;
  color: #fff;
  transition: color 180ms ease, background-color 180ms ease;
}

.mobile-navigation__item.is-active {
  color: #05060a;
}

.mobile-navigation__item :deep(.scramble) {
  padding: 8px 12px;
}

.mobile-navigation__item.is-active :deep(.scramble) {
  background: #fff;
}

.mobile-navigation__item.is-active .mobile-navigation__index {
  color: rgb(255 255 255 / 42%);
}

.mobile-navigation__index {
  color: rgb(255 255 255 / 42%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

.mobile-navigation__item :deep(.scramble__text),
.mobile-navigation__item :deep(.scramble__sizer) {
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(22px, calc(9vw - 10px), 42px) !important;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.mobile-navigation__item.is-active :deep(.scramble__text),
.mobile-navigation__item.is-active :deep(.scramble__sizer) {
  color: #05060a !important;
}

@media (hover: hover) and (min-width: 969px) {
  .mobile-navigation__item:hover {
    color: #fff;
    background: transparent;
  }

  .mobile-navigation__item:hover .mobile-navigation__index {
    color: rgb(255 255 255 / 42%);
  }

  .mobile-navigation__item:hover :deep(.scramble) {
    background: #fff;
  }

  .mobile-navigation__item:hover :deep(.scramble__text),
  .mobile-navigation__item:hover :deep(.scramble__sizer) {
    color: #05060a !important;
  }
}

.mobile-navigation__connect {
  margin-top: auto;
  margin-right: -28px;
  margin-left: -28px;
  padding-top: 24px;
  padding-right: 28px;
  padding-left: 28px;
  border-top: 1px solid rgb(255 255 255 / 20%);
  color: rgb(255 255 255 / 78%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.mobile-navigation__connect-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-navigation__audio {
  margin: 24px -28px -28px;
  padding: 18px 28px 20px;
  border-top: 1px solid rgb(255 255 255 / 20%);
}

.mobile-navigation__audio-button {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: #fff;
  cursor: pointer;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
}

.mobile-navigation__audio-icon,
.rail-audio-icon {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  min-height: 18px;
}

.mobile-navigation__audio-icon .indicator-line,
.rail-audio-icon .indicator-line {
  height: 16px;
  transform: scaleY(0.25);
  transform-origin: center;
}

.mobile-navigation__audio-icon .indicator-line.active,
.rail-audio-icon .indicator-line.active {
  animation: mobile-audio-indicator 0.5s ease infinite;
}

@keyframes mobile-audio-indicator {
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
}

.mobile-navigation__audio-label { white-space: nowrap; }

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1), opacity 220ms ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  transform: scaleX(0);
  opacity: 0;
}

.menu-icon__line { transition: transform 220ms ease, width 220ms ease; }

button[aria-expanded='true'] .menu-icon__line--top { transform: translateY(3px) rotate(45deg); }
button[aria-expanded='true'] .menu-icon__line--bottom { width: 26px; transform: translateY(-3px) rotate(-45deg); }

.layout-enter-active,
.layout-leave-active {
  transition: opacity 500ms ease;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
