<template>
  <div class="lang-toggle" role="group" :aria-label="$t('nav.switchLanguage')">
    <button
      type="button"
      class="lang-toggle__option"
      :class="{ 'is-active': locale === 'pl' }"
      :aria-pressed="locale === 'pl'"
      @click="setLocale('pl')"
    >PL</button>
    <span class="lang-toggle__divider" aria-hidden="true">/</span>
    <button
      type="button"
      class="lang-toggle__option"
      :class="{ 'is-active': locale === 'en' }"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >EN</button>
  </div>
</template>

<script lang="ts" setup>
const { locale, setLocale } = useI18n()
</script>

<style scoped>
.lang-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
}

.lang-toggle__option {
  padding: 2px;
  color: rgb(255 255 255 / 42%);
  cursor: pointer;
  transition: color 180ms ease;
}

.lang-toggle__option.is-active {
  color: #fff;
}

.lang-toggle__option:hover {
  color: #5ee2dd;
}

.lang-toggle__divider {
  color: rgb(255 255 255 / 28%);
}
</style>
