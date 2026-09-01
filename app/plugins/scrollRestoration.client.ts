export default defineNuxtPlugin(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  window.scrollTo(0, 0)
})
