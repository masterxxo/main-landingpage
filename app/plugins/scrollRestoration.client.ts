export default defineNuxtPlugin(() => {
  // Po odświeżeniu zawsze zaczynamy od góry strony.
  //
  // Domyślnie przeglądarka przywraca poprzednią pozycję scrolla. HeroParallax
  // w trybie `fixed-size` renderuje canvas WebGL tylko raz — przy mount, w rozmiarze
  // kontenera z bieżącej pozycji. Jeśli strona wstanie już przescrollowana, canvas
  // dostaje złe proporcje i „rozciąga się" przy powrocie na górę. Blokujemy więc
  // przywracanie scrolla i ustawiamy pozycję na 0 zanim GSAP/three cokolwiek policzą.
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  window.scrollTo(0, 0)
})
