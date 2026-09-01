import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { DESKTOP_MIN_WIDTH, MOTION_ALLOWED_QUERY, REDUCED_MOTION_QUERY } from '~/constants/media'

export function useAboutReveal(
  heroSection: Ref<HTMLElement | null>,
  aboutSection: Ref<HTMLElement | null>,
  active: Ref<boolean>,
): void {
  let media: gsap.MatchMedia | null = null
  let observer: IntersectionObserver | null = null
  let trigger: ScrollTrigger | null = null

  function teardown(): void {
    observer?.disconnect()
    observer = null
    trigger?.kill()
    trigger = null
  }

  onMounted(() => {
    gsap.registerPlugin(ScrollTrigger)
    media = gsap.matchMedia()
    media.add({
      desktop: `(min-width: ${DESKTOP_MIN_WIDTH}px)`,
      mobile: `(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`,
      portrait: '(orientation: portrait)',
      motionAllowed: MOTION_ALLOWED_QUERY,
      reducedMotion: REDUCED_MOTION_QUERY,
    }, (context) => {
      const { desktop, mobile, motionAllowed, reducedMotion } = context.conditions as Record<string, boolean>

      teardown()
      if (reducedMotion) {
        active.value = true
      }
      else if (motionAllowed && mobile && aboutSection.value) {
        observer = new IntersectionObserver(([entry]) => {
          if (!entry?.isIntersecting) return
          active.value = true
          observer?.disconnect()
          observer = null
        }, { threshold: 0.28 })
        observer.observe(aboutSection.value)
      }
      else if (motionAllowed && desktop && heroSection.value) {
        trigger = ScrollTrigger.create({
          trigger: heroSection.value,
          start: 'bottom 120%',
          once: true,
          onEnter: () => { active.value = true },
        })
      }

      ScrollTrigger.refresh()
      return teardown
    })
  })

  onBeforeUnmount(() => {
    media?.revert()
    media = null
    teardown()
  })
}
