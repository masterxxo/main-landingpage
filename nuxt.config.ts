import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  modules: ['@nuxt/fonts', '@nuxtjs/i18n'],
  fonts: {
    families: [
      { name: "IBM Plex Mono", provider: 'google' },
      { name: 'Cabinet Grotesk', provider: 'fontshare', weights: [400, 900], global: true },
    ]
  },
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json' },
      { code: 'pl', language: 'pl-PL', file: 'pl.json' },
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    baseUrl: 'https://rogson.dev',
  }
})
