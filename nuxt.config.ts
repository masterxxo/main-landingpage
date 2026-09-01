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
  modules: ['@nuxt/fonts'],
  fonts: {
    families: [
      { name: "IBM Plex Mono", provider: 'google' },
      { name: 'Cabinet Grotesk', provider: 'fontshare', weights: [400, 900], global: true },
    ]
  }
})
