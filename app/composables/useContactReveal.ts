import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { DESKTOP_MIN_WIDTH, MOTION_ALLOWED_QUERY, REDUCED_MOTION_QUERY } from '~/constants/media'

interface ContactRevealElements {
  section: Ref<HTMLElement | null>
  heading: Ref<HTMLElement | null>
  contactItems: Ref<HTMLElement[]>
}

export function useContactReveal(
  els: ContactRevealElements,
  onSectionActive: () => void,
): void {
  let timeline: gsap.core.Timeline | null = null
  let media: gsap.MatchMedia | null = null

  function build(): void {
    if (!els.section.value || !els.heading.value) return

    timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: {
        trigger: els.section.value,
        start: 'top 78%',
        once: true,
        onEnter: onSectionActive,
      },
    })

    timeline
      .from(els.heading.value, { autoAlpha: 0, y: 56, duration: 0.9 })
      .from(els.contactItems.value, {
        autoAlpha: 0,
        y: 28,
        duration: 0.62,
        stagger: 0.12,
      }, '-=0.45')
  }

  function teardown(): void {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null

    if (els.heading.value) {
      gsap.set(els.heading.value, { clearProps: 'opacity,visibility,transform' })
    }
    gsap.set(els.contactItems.value, { clearProps: 'opacity,visibility,transform' })
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
      const { motionAllowed, reducedMotion } = context.conditions as Record<string, boolean>

      teardown()
      if (reducedMotion) onSectionActive()
      else if (motionAllowed) build()

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
