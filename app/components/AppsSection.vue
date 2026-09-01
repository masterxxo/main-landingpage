<template>
  <section ref="section" class="apps-section" aria-labelledby="apps-title">
    <div ref="stage" class="apps-section__stage">
      <header class="apps-section__intro">
        <span class="apps-section__index">003</span>
        <h2 id="apps-title" class="apps-section__title">APPS</h2>
        <AnimatedWriterText
          class="apps-section__description"
          :active="sectionDescriptionActive"
          :ms-per-character="18"
          text="Kilka aplikacji, w które można wejść i po prostu ich użyć — bez landing page'a, bez zapisywania się do newslettera. Zaczynam od jednej, będzie ich więcej."
        />
      </header>

      <div class="apps-track">
        <article
          v-for="(app, index) in apps"
          :key="app.name"
          :ref="element => setCardRef(element, index)"
          class="app-card"
        >
          <div class="app-card__topline">
            <span class="app-card__number">0{{ index + 1 }}</span>
            <span class="app-card__status" :class="`is-${app.statusClass}`">
              {{ app.status }}
            </span>
          </div>

          <div class="app-card__body">
            <img
              v-if="app.logo"
              class="app-card__icon"
              :src="app.logo"
              alt=""
            >
            <component :is="app.icon" v-else-if="app.icon" class="app-card__icon" />
            <span v-else class="app-card__icon-placeholder" aria-hidden="true" />
            <h3 class="app-card__name">{{ app.name }}</h3>

            <AnimatedWriterText
              v-if="app.description"
              class="app-card__description"
              :active="appDescriptionActive[index] ?? false"
              :ms-per-character="17"
              :text="app.description"
            />
            <div v-else class="app-card__description-hook" aria-hidden="true" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component, ComponentPublicInstance } from 'vue'

interface AppItem {
  name: string
  status: string
  statusClass: string
  description?: string
  logo?: string
  icon?: Component
}

const apps: AppItem[] = [
  {
    name: 'SoloQuest',
    status: 'LIVE',
    statusClass: 'live',
    logo: '/img/soloquest_logo_transparent.png',
    description: 'Tracker questów, który zbudowałem dla siebie — Nuxt 4, Hono i Drizzle na własnym serwerze. Testowa wersja tego, jak lubię teraz pisać software.',
  },
  { name: 'App #2', status: 'IN PROGRESS', statusClass: 'progress' },
  { name: 'App #3', status: 'INCOMING', statusClass: 'incoming' },
]

const section = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const cards = ref<HTMLElement[]>([])
const sectionDescriptionActive = ref(false)
const appDescriptionActive = ref(apps.map(() => false))

function setCardRef(element: Element | ComponentPublicInstance | null, index: number): void {
  if (element instanceof HTMLElement) cards.value[index] = element
}

useAppsScrollTimeline(
  { section, stage, cards },
  {
    onSectionActive: () => { sectionDescriptionActive.value = true },
    onSoloQuestPeak: () => { appDescriptionActive.value[0] = true },
    onMobileCardActive: (index) => { appDescriptionActive.value[index] = true },
  },
)
</script>

<style scoped>
.apps-section {
  position: relative;
  min-height: 100svh;
  background: #000;
  color: #fff;
}

.apps-section__stage {
  display: grid;
  grid-template-columns: clamp(220px, 18vw, 260px) minmax(0, 1fr);
  gap: clamp(36px, 5vw, 88px);
  width: 100%;
  height: 100svh;
  padding: clamp(88px, 11vh, 132px) max(5vw, 68px) clamp(48px, 7vh, 84px) 7.2%;
  overflow: hidden;
}

.apps-section__intro {
  align-self: start;
  font-family: 'Cabinet Grotesk', sans-serif;
}

.apps-section__index,
.app-card__number,
.app-card__status {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
}

.apps-section__index {
  display: block;
  margin-bottom: 14px;
  color: rgb(255 255 255 / 55%);
}

.apps-section__title {
  margin: 0 0 28px;
  font-size: clamp(48px, 5.7vw, 92px);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.055em;
}

.apps-section__description {
  color: rgb(255 255 255 / 72%);
  font-size: 15px;
  line-height: 1.5;
}

.apps-track {
  display: flex;
  min-width: 0;
  height: 100%;
  border-top: 1px solid rgb(255 255 255 / 24%);
  border-bottom: 1px solid rgb(255 255 255 / 24%);
}

.app-card {
  position: relative;
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  padding: 20px clamp(18px, 2vw, 34px) 30px;
  overflow: hidden;
  border-left: 1px solid rgb(255 255 255 / 24%);
  will-change: opacity;
}

.app-card:last-child {
  border-right: 1px solid rgb(255 255 255 / 24%);
}

.app-card__topline {
  position: absolute;
  top: 20px;
  right: clamp(18px, 2vw, 34px);
  left: clamp(18px, 2vw, 34px);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-card__number {
  color: rgb(255 255 255 / 42%);
}

.app-card__status {
  padding: 5px 8px;
  border: 1px solid rgb(255 255 255 / 28%);
  color: rgb(255 255 255 / 70%);
  font-size: 9px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.app-card__status.is-live {
  border-color: rgb(89 255 116 / 68%);
  color: #59ff74;
  box-shadow: 0 0 14px rgb(89 255 116 / 14%);
}

.app-card__status.is-progress {
  border-color: rgb(255 224 92 / 62%);
  color: #ffe05c;
  box-shadow: 0 0 14px rgb(255 224 92 / 12%);
}

.app-card__body {
  align-self: flex-end;
  width: min(100%, 520px);
}

.app-card__icon-placeholder,
.app-card__icon {
  display: block;
  width: 34px;
  height: 34px;
  margin: 0 0 28px 7px;
  transform-origin: left bottom;
  will-change: transform;
}

.app-card__icon {
  width: 54px;
  height: 54px;
  margin: 0 0 14px;
  object-fit: contain;
}

.app-card__icon-placeholder {
  border: 1px solid rgb(255 255 255 / 70%);
  transform: rotate(45deg);
}

.app-card__name {
  margin: 0;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(28px, 3vw, 52px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.05em;
  white-space: nowrap;
  transform-origin: left bottom;
  will-change: transform;
}

.app-card__description,
.app-card__description-hook {
  width: min(100%, 460px);
  min-height: 88px;
  margin-top: 24px;
}

.app-card__description {
  color: rgb(255 255 255 / 72%);
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

@media (max-width: 1023px) {
  .apps-section__stage {
    display: block;
    height: auto;
    min-height: 100svh;
    padding: 88px 24px 64px;
    overflow: visible;
  }

  .apps-section__intro {
    max-width: 560px;
    margin-bottom: 72px;
  }

  .apps-track {
    display: block;
    height: auto;
    border-bottom: 0;
  }

  .app-card {
    min-height: 62svh;
    padding: 20px 18px 34px;
    border-right: 1px solid rgb(255 255 255 / 24%);
    border-bottom: 1px solid rgb(255 255 255 / 24%);
  }

  .app-card__name {
    font-size: clamp(42px, 12vw, 68px);
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-card,
  .app-card__icon,
  .app-card__icon-placeholder,
  .app-card__name {
    will-change: auto;
  }
}
</style>
