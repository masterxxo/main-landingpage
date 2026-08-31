import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { APPS_CARD_FLEX, APPS_DESKTOP_MIN_WIDTH, APPS_TIMELINE } from '~/constants/appsLayout'

interface AppsScrollElements {
  section: Ref<HTMLElement | null>
  stage: Ref<HTMLElement | null>
  cards: Ref<HTMLElement[]>
}

interface AppsScrollHooks {
  onSectionActive: () => void
  onSoloQuestPeak: () => void
  onMobileCardActive: (index: number) => void
}

export function useAppsScrollTimeline(
  els: AppsScrollElements,
  hooks: AppsScrollHooks,
): void {
  let entrance: gsap.core.Tween | null = null
  let timeline: gsap.core.Timeline | null = null
  let desktopQuery: MediaQueryList | null = null
  let observers: IntersectionObserver[] = []
  let soloPeakProgress = 1
  let soloPeakReached = false

  function buildDesktop(): void {
    if (!els.section.value || !els.stage.value || els.cards.value.length !== 3) return

    const cards = els.cards.value
    const iconTargets = cards.map(card => [
      card.querySelector<HTMLElement>('.app-card__icon'),
      card.querySelector<HTMLElement>('.app-card__icon-placeholder'),
    ].filter((target): target is HTMLElement => target !== null))
    const nameTargets = cards.map(card => card.querySelector<HTMLElement>('.app-card__name'))

    gsap.set(cards, { flexGrow: APPS_CARD_FLEX.idle, opacity: 1 })
    gsap.set(iconTargets.flat(), { scale: 1, y: 0 })
    gsap.set(nameTargets, { scale: 1 })

    entrance = gsap.fromTo(els.stage.value, {
      autoAlpha: 0,
      y: 72,
    }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: els.section.value,
        start: 'top 88%',
        end: 'top 42%',
        scrub: 0.7,
      },
    })

    timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: els.section.value,
        start: 'top top',
        end: '+=320%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: hooks.onSectionActive,
        onEnterBack: hooks.onSectionActive,
        onUpdate: (self) => {
          if (!soloPeakReached && self.progress >= soloPeakProgress) {
            soloPeakReached = true
            hooks.onSoloQuestPeak()
          }
        },
      },
    })

    const { hold, expand, peakHold } = APPS_TIMELINE
    timeline.to({}, { duration: hold })

    cards.forEach((card, activeIndex) => {
      const start = timeline!.duration()

      cards.forEach((target, index) => {
        timeline!.to(target, {
          flexGrow: index === activeIndex ? APPS_CARD_FLEX.active : APPS_CARD_FLEX.idle,
          opacity: index === activeIndex ? 1 : 0.34,
          duration: expand,
        }, start)

        timeline!.to(iconTargets[index] ?? [], {
          scale: index === activeIndex ? 1.75 : 1,
          y: index === activeIndex ? -48 : 0,
          duration: expand,
        }, start)

        timeline!.to(nameTargets[index], {
          scale: index === activeIndex ? 1.75 : 1,
          duration: expand,
        }, start)
      })

      if (activeIndex === 0) {
        soloPeakProgress = timeline!.duration()
      }

      timeline!.to({}, { duration: peakHold })
    })

    const totalDuration = timeline.totalDuration()
    soloPeakProgress = totalDuration > 0 ? soloPeakProgress / totalDuration : 1
  }

  function buildMobile(): void {
    if (!els.section.value || !els.stage.value) return

    gsap.set(els.stage.value, { clearProps: 'all' })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hooks.onSectionActive()
      els.cards.value.forEach((card, index) => {
        gsap.set(card, { clearProps: 'all' })
        hooks.onMobileCardActive(index)
      })
      return
    }

    const sectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      hooks.onSectionActive()
      sectionObserver.disconnect()
    }, { threshold: 0.15 })
    sectionObserver.observe(els.section.value)
    observers.push(sectionObserver)

    els.cards.value.forEach((card, index) => {
      gsap.set(card, { autoAlpha: 0, y: 40, clearProps: 'flex-grow' })
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return

        gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' })
        hooks.onMobileCardActive(index)
        observer.disconnect()
      }, { threshold: 0.25 })

      observer.observe(card)
      observers.push(observer)
    })
  }

  function teardown(): void {
    entrance?.scrollTrigger?.kill()
    entrance?.kill()
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    entrance = null
    timeline = null
    soloPeakReached = false
    observers.forEach(observer => observer.disconnect())
    observers = []

    if (els.stage.value) gsap.set(els.stage.value, { clearProps: 'opacity,visibility,transform' })
    els.cards.value.forEach(card => {
      gsap.set(card, { clearProps: 'opacity,visibility,transform,flex-grow' })
      gsap.set(card.querySelectorAll('.app-card__icon, .app-card__icon-placeholder, .app-card__name'), {
        clearProps: 'transform',
      })
    })
  }

  function handleModeChange(query: MediaQueryList | MediaQueryListEvent): void {
    teardown()
    if (query.matches) buildDesktop()
    else buildMobile()
    ScrollTrigger.refresh()
  }

  onMounted(() => {
    gsap.registerPlugin(ScrollTrigger)
    desktopQuery = window.matchMedia(
      `(min-width: ${APPS_DESKTOP_MIN_WIDTH}px) and (prefers-reduced-motion: no-preference)`,
    )
    handleModeChange(desktopQuery)
    desktopQuery.addEventListener('change', handleModeChange)
  })

  onBeforeUnmount(() => {
    desktopQuery?.removeEventListener('change', handleModeChange)
    teardown()
  })
}
