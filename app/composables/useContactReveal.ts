import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'

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

  onMounted(() => {
    if (!els.section.value || !els.heading.value) return

    gsap.registerPlugin(ScrollTrigger)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSectionActive()
      return
    }

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
  })

  onBeforeUnmount(() => {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null

    if (els.heading.value) {
      gsap.set(els.heading.value, { clearProps: 'opacity,visibility,transform' })
    }
    gsap.set(els.contactItems.value, { clearProps: 'opacity,visibility,transform' })
  })
}
