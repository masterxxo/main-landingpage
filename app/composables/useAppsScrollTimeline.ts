import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { APPS_CARD_FLEX, APPS_TIMELINE } from '~/constants/appsLayout'
import { DESKTOP_MIN_WIDTH, MOTION_ALLOWED_QUERY, REDUCED_MOTION_QUERY } from '~/constants/media'

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
  let media: gsap.MatchMedia | null = null
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
    if (!els.section.value || !els.stage.value || els.cards.value.length !== 3) return

    const cards = els.cards.value
    const detailTargets = cards.map(card => card.querySelector<HTMLElement>('.app-card__body'))
    const iconTargets = cards.map(card => [
      card.querySelector<HTMLElement>('.app-card__icon'),
      card.querySelector<HTMLElement>('.app-card__icon-placeholder'),
    ].filter((target): target is HTMLElement => target !== null))

    gsap.set(cards, { flexGrow: 1, opacity: 0.62 })
    gsap.set(detailTargets, { scale: 0.88, transformOrigin: 'left bottom' })
    gsap.set(iconTargets.flat(), { scale: 0.9, y: 8 })

    timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: els.section.value,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (cards.length * 1.15 + 0.45))}`,
        pin: true,
        scrub: 0.85,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: hooks.onSectionActive,
        onEnterBack: hooks.onSectionActive,
      },
    })

    timeline.to({}, { duration: 0.35 })

    cards.forEach((card, activeIndex) => {
      const expandAt = timeline!.duration()

      cards.forEach((target, index) => {
        timeline!.to(target, {
          flexGrow: index === activeIndex ? 3.4 : 0.72,
          opacity: index === activeIndex ? 1 : 0.38,
          duration: 0.72,
        }, expandAt)
        timeline!.to(detailTargets[index], {
          scale: index === activeIndex ? 1 : 0.84,
          duration: 0.72,
        }, expandAt)
        timeline!.to(iconTargets[index] ?? [], {
          scale: index === activeIndex ? 1.18 : 0.86,
          y: index === activeIndex ? 0 : 8,
          duration: 0.72,
        }, expandAt)
      })

      timeline!.call(() => hooks.onMobileCardActive(activeIndex))
      timeline!.to({}, { duration: 0.48 })

      const collapseAt = timeline!.duration()
      timeline!.to(cards, {
        flexGrow: 1,
        opacity: 0.62,
        duration: 0.52,
      }, collapseAt)
      timeline!.to(detailTargets, {
        scale: 0.88,
        duration: 0.52,
      }, collapseAt)
      timeline!.to(iconTargets.flat(), {
        scale: 0.9,
        y: 8,
        duration: 0.52,
      }, collapseAt)
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
    if (els.stage.value) gsap.set(els.stage.value, { clearProps: 'opacity,visibility,transform' })
    els.cards.value.forEach(card => {
      gsap.set(card, { clearProps: 'opacity,visibility,transform,flex-grow' })
      gsap.set(card.querySelectorAll('.app-card__body, .app-card__icon, .app-card__icon-placeholder, .app-card__name'), {
        clearProps: 'transform',
      })
    })
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
        hooks.onSectionActive()
        els.cards.value.forEach((card, index) => {
          gsap.set(card, { clearProps: 'all' })
          hooks.onMobileCardActive(index)
        })
      }
      else if (motionAllowed && desktop) buildDesktop()
      else if (motionAllowed && mobile) buildMobile()

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
