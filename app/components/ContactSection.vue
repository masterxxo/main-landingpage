<template>
  <section
    ref="section"
    id="contact"
    class="contact-section"
    :style="{ backgroundImage: resolvedBackgroundImage }"
    aria-labelledby="contact-title"
  >
    <div class="contact-section__shade" aria-hidden="true" />

    <div class="contact-section__content">
      <div ref="heading" class="contact-section__heading">
        <span class="contact-section__index">004</span>
        <span class="contact-section__eyebrow">// GET IN TOUCH</span>
        <h2 id="contact-title" class="contact-section__title">
          STILL CURIOUS.<br>STILL AVAILABLE.
        </h2>

        <span class="contact-section__horizontal-line" aria-hidden="true" />

        <AnimatedWriterText
          class="contact-section__description"
          :active="descriptionActive"
          :ms-per-character="18"
          text="Nie prowadzę newslettera i nie mam formularza kontaktowego z dziesięcioma polami. Napisz maila albo złap mnie na X."
        />
      </div>

      <div class="contact-list" aria-label="Kanały kontaktowe">
        <a
          v-for="(contact, index) in contacts"
          :key="contact.label"
          :ref="element => setContactRef(element, index)"
          class="contact-list__item"
          :href="contact.href"
          :target="contact.external ? '_blank' : undefined"
          :rel="contact.external ? 'noopener noreferrer' : undefined"
        >
          <component :is="contact.icon" class="contact-list__icon" />
          <span class="contact-list__copy">
            <span class="contact-list__label">{{ contact.label }}</span>
            <span class="contact-list__value">{{ contact.value }}</span>
          </span>
          <span class="contact-list__arrow" aria-hidden="true">↗</span>
        </a>
      </div>

      <span class="contact-section__vertical-line" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component, ComponentPublicInstance } from 'vue'
import ContactEmailIcon from '~/components/icons/ContactEmailIcon.vue'
import ContactXIcon from '~/components/icons/ContactXIcon.vue'

const props = defineProps<{
  backgroundImage?: string
}>()

interface ContactItem {
  label: string
  value: string
  href: string
  icon: Component
  external?: boolean
}

const contacts: ContactItem[] = [
  {
    label: 'E-MAIL',
    value: 'kontakt@matrog.pl',
    href: 'mailto:kontakt@matrog.pl',
    icon: ContactEmailIcon,
  },
  {
    label: 'X / TWITTER',
    value: '@rogson_dev',
    href: 'https://x.com/rogson_dev',
    icon: ContactXIcon,
    external: true,
  },
]

const resolvedBackgroundImage = computed(() => props.backgroundImage
  ? `url("${props.backgroundImage}")`
  : 'radial-gradient(circle at 76% 72%, rgb(222 38 139 / 26%), transparent 35%), radial-gradient(circle at 22% 62%, rgb(13 180 185 / 24%), transparent 38%), linear-gradient(155deg, #080b13 0%, #101526 48%, #050609 100%)')

const section = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)
const contactItems = ref<HTMLElement[]>([])
const descriptionActive = ref(false)

function setContactRef(element: Element | ComponentPublicInstance | null, index: number): void {
  if (element instanceof HTMLElement) contactItems.value[index] = element
}

useContactReveal(
  { section, heading, contactItems },
  () => { descriptionActive.value = true },
)
</script>

<style scoped>
.contact-section {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background-color: #050609;
  background-position: center;
  background-size: cover;
  color: #fff;
}

.contact-section__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(0 0 0 / 58%) 0%, rgb(0 0 0 / 38%) 62%, rgb(0 0 0 / 48%) 100%),
    linear-gradient(180deg, rgb(0 0 0 / 48%) 0%, rgb(0 0 0 / 14%) 48%, rgb(0 0 0 / 68%) 100%);
  pointer-events: none;
}

.contact-section__content {
  --navigation-frame-inset: 16px;
  --navigation-header-height: 51px;
  --navigation-rail-width: 67px;
  --contact-column-gap: clamp(56px, 8vw, 144px);
  --contact-padding-top: clamp(88px, 11vh, 132px);
  --contact-padding-right: max(5vw, 68px);
  --contact-padding-bottom: clamp(56px, 8vh, 96px);
  --contact-padding-left: 7.2vw;

  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.6fr);
  align-items: end;
  gap: var(--contact-column-gap);
  width: 100%;
  min-height: 100svh;
  padding: var(--contact-padding-top) var(--contact-padding-right) var(--contact-padding-bottom) var(--contact-padding-left);
}

.contact-section__heading {
  align-self: start;
}

.contact-section__index,
.contact-section__eyebrow,
.contact-list__label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
}

.contact-section__index {
  display: block;
  margin-bottom: clamp(48px, 8vh, 92px);
  color: rgb(255 255 255 / 55%);
}

.contact-section__eyebrow {
  display: block;
  margin-bottom: 18px;
  color: #5ee2dd;
  letter-spacing: 0.08em;
}

.contact-section__title {
  margin: 0;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(58px, 7.5vw, 132px);
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.06em;
}

.contact-section__horizontal-line {
  display: block;
  width: calc(
    100% + var(--contact-column-gap) + var(--contact-padding-left)
    - var(--navigation-frame-inset) - var(--navigation-rail-width)
  );
  height: 1px;
  margin-top: clamp(28px, 4vh, 48px);
  margin-left: calc(
    var(--navigation-frame-inset) + var(--navigation-rail-width)
    - var(--contact-padding-left)
  );
  background: rgb(255 255 255 / 28%);
  pointer-events: none;
}

.contact-section__description {
  width: min(100%, 620px);
  min-height: 68px;
  margin-top: clamp(22px, 3vh, 36px);
  color: rgb(255 255 255 / 72%);
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

.contact-list {
  width: 100%;
  border-top: 1px solid rgb(255 255 255 / 28%);
}

.contact-section__vertical-line {
  position: absolute;
  top: calc(var(--navigation-frame-inset) + var(--navigation-header-height));
  bottom: var(--navigation-frame-inset);
  left: calc(
    var(--contact-padding-left)
    + (100% - var(--contact-padding-left) - var(--contact-padding-right) - var(--contact-column-gap)) * 0.7
    + var(--contact-column-gap)
  );
  width: 1px;
  background: rgb(255 255 255 / 28%);
  pointer-events: none;
}

.contact-list__item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 98px;
  padding: 18px 4px;
  border-bottom: 1px solid rgb(255 255 255 / 28%);
  color: #fff;
  text-decoration: none;
  transition: color 220ms ease, padding 220ms ease, background-color 220ms ease;
}

.contact-list__item:hover,
.contact-list__item:focus-visible {
  padding-right: 14px;
  padding-left: 14px;
  background: rgb(255 255 255 / 7%);
  color: #5ee2dd;
  outline: none;
}

.contact-list__icon {
  width: 28px;
  height: 28px;
}

.contact-list__copy {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.contact-list__label {
  color: rgb(255 255 255 / 52%);
  letter-spacing: 0.08em;
}

.contact-list__value {
  overflow: hidden;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(18px, 1.6vw, 25px);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-list__arrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 20px;
}

@media (max-width: 968px) {
  .contact-section {
    background-position: center;
  }

  .contact-section__content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 52px;
    padding: 88px 24px 64px;
  }

  .contact-section__vertical-line {
    display: none;
  }

  .contact-section__heading {
    align-self: stretch;
  }

  .contact-section__index {
    margin-bottom: 48px;
  }

  .contact-section__title {
    font-size: clamp(46px, 13.2vw, 82px);
  }

  .contact-section__horizontal-line {
    width: 100%;
    margin-left: 0;
  }

  .contact-section__description {
    min-height: 90px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-list__item {
    transition: none;
  }
}
</style>
