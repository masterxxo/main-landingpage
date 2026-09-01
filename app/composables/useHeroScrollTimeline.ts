import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ComputedRef, Ref } from 'vue'
import { HERO_CLIP_FINAL, HERO_CLIP_INITIAL } from '~/constants/heroClipPaths'
import { HERO_CARD, HERO_TIMELINE } from '~/constants/heroLayout'
import { ABOUT_CARD_FINAL, ABOUT_PHASE } from '~/constants/aboutLayout'
import { DESKTOP_MIN_WIDTH, MOTION_ALLOWED_QUERY, REDUCED_MOTION_QUERY } from '~/constants/media'

export interface HeroScrollElements {
  section: Ref<HTMLElement | null>
  stage: Ref<HTMLElement | null>
  card: Ref<HTMLElement | null>
  clipPath: Ref<SVGPathElement | null>
  borderPath: Ref<SVGPathElement | null>
  border: Ref<SVGSVGElement | null>
  labels: Ref<HTMLElement | null>
  title: Ref<HTMLElement | null>
  grid: Ref<HTMLElement | null>
  smallPlaceholder: Ref<HTMLElement | null>
  sidePlaceholder: Ref<HTMLElement | null>
  annotation: Ref<HTMLElement | null>
  aboutBg: Ref<HTMLElement | null>
  aboutSideLabel: Ref<HTMLElement | null>
  aboutCopy: Ref<HTMLElement | null>
  cardReveal: Ref<number | undefined>
  cardShowSecond: Ref<boolean>
}

interface HeroScrollHooks {
  onActivate?: () => void
  onDeactivate?: () => void
}

export interface HeroScrollTimeline {
  isStaticLayout: Ref<boolean>
  heroSettled: Ref<boolean>
  restingCardPath: ComputedRef<string>
  getProgress: () => number
}

const HERO_END = Math.max(
  ...Object.values(HERO_TIMELINE)
    .filter((v): v is { start: number, duration: number } => typeof v === 'object')
    .map(v => v.start + v.duration),
)

function aboutFinalRect() {
  const width = Math.min(window.innerWidth * ABOUT_CARD_FINAL.widthRatio, ABOUT_CARD_FINAL.maxWidth)
  const height = window.innerHeight * ABOUT_CARD_FINAL.heightRatio
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  }
}

export function useHeroScrollTimeline(
  els: HeroScrollElements,
  hooks: HeroScrollHooks = {},
): HeroScrollTimeline {
  const isStaticLayout = ref(false)
  const heroSettled = ref(false)
  const restingCardPath = computed(
    () => (isStaticLayout.value ? HERO_CLIP_FINAL : HERO_CLIP_INITIAL),
  )

  let timeline: gsap.core.Timeline | null = null
  let media: gsap.MatchMedia | null = null
  let heroSettleAt = 1

  function getProgress(): number {
    return timeline?.progress() ?? 0
  }

  function syncRestingPath(): void {
    els.clipPath.value?.setAttribute('d', restingCardPath.value)
    els.borderPath.value?.setAttribute('d', restingCardPath.value)
  }

  function buildDesktop(): void {
    const { section, card, clipPath, borderPath, border, labels } = els
    const { title, grid, smallPlaceholder, sidePlaceholder, annotation } = els
    const { aboutBg, aboutSideLabel, aboutCopy } = els

    if (
      !section.value || !card.value || !clipPath.value || !borderPath.value
      || !border.value || !labels.value || !title.value || !grid.value
      || !smallPlaceholder.value || !sidePlaceholder.value || !annotation.value
      || !aboutBg.value || !aboutSideLabel.value || !aboutCopy.value
    ) return

    gsap.set([title.value, grid.value, smallPlaceholder.value, sidePlaceholder.value, annotation.value], {
      autoAlpha: 0,
    })
    gsap.set([aboutBg.value, aboutSideLabel.value, aboutCopy.value], { autoAlpha: 0 })
    els.cardShowSecond.value = false
    clipPath.value.setAttribute('d', HERO_CLIP_INITIAL)
    borderPath.value.setAttribute('d', HERO_CLIP_INITIAL)

    timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress >= heroSettleAt) heroSettled.value = true
        },
      },
    })

    timeline
      .to(labels.value, {
        autoAlpha: 0,
        y: -30,
        duration: HERO_TIMELINE.labelsOut.duration,
      }, HERO_TIMELINE.labelsOut.start)
      .to(card.value, {
        width: () => Math.min(window.innerWidth * HERO_CARD.widthRatio, HERO_CARD.maxWidth),
        height: HERO_CARD.height,
        left: () => window.innerWidth * HERO_CARD.leftRatio,
        top: () => window.innerHeight * HERO_CARD.topRatio,
        duration: HERO_TIMELINE.reshape.duration,
      }, HERO_TIMELINE.reshape.start)
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_FINAL },
        duration: HERO_TIMELINE.reshape.duration,
      }, HERO_TIMELINE.reshape.start)
      .fromTo(title.value, { y: 36 }, {
        autoAlpha: 1,
        y: 0,
        duration: HERO_TIMELINE.title.duration,
      }, HERO_TIMELINE.title.start)
      .fromTo(smallPlaceholder.value, { x: -80 }, {
        autoAlpha: 1,
        x: 0,
        duration: HERO_TIMELINE.smallPlaceholder.duration,
      }, HERO_TIMELINE.smallPlaceholder.start)
      .fromTo(sidePlaceholder.value, { x: 140 }, {
        autoAlpha: 1,
        x: 0,
        duration: HERO_TIMELINE.sidePlaceholder.duration,
      }, HERO_TIMELINE.sidePlaceholder.start)
      .to(grid.value, {
        autoAlpha: 1,
        duration: HERO_TIMELINE.grid.duration,
      }, HERO_TIMELINE.grid.start)
      .to(annotation.value, {
        autoAlpha: 1,
        duration: HERO_TIMELINE.annotation.duration,
      }, HERO_TIMELINE.annotation.start)

    const { regrow, flip, shrink, copyIn } = ABOUT_PHASE

    const flipProgress = { value: 0 }
    const applyFlip = (): void => {
      const progress = flipProgress.value
      if (progress < 0.5) {
        els.cardReveal.value = 1 - progress * 2
        els.cardShowSecond.value = false
      }
      else {
        els.cardReveal.value = (progress - 0.5) * 2
        els.cardShowSecond.value = true
      }
    }

    timeline
      .to(card.value, {
        width: () => window.innerWidth,
        height: () => window.innerHeight,
        left: 0,
        top: 0,
        duration: regrow.duration,
      }, HERO_END + regrow.start)
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_INITIAL },
        duration: regrow.duration,
      }, HERO_END + regrow.start)
      .to([
        title.value, grid.value, smallPlaceholder.value, sidePlaceholder.value,
        annotation.value, border.value,
      ], {
        autoAlpha: 0,
        duration: regrow.duration * 0.5,
      }, HERO_END + regrow.start)

      .set(aboutBg.value, { autoAlpha: 1 }, HERO_END + flip.start)

      .to(flipProgress, {
        value: 1,
        duration: flip.duration,
        onUpdate: applyFlip,
      }, HERO_END + flip.start)


      .to(card.value, {
        width: () => aboutFinalRect().width,
        height: () => aboutFinalRect().height,
        left: () => aboutFinalRect().left,
        top: () => aboutFinalRect().top,
        duration: shrink.duration,
      }, HERO_END + shrink.start)
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_FINAL },
        duration: shrink.duration,
      }, HERO_END + shrink.start)
      .to(border.value, {
        autoAlpha: 1,
        duration: shrink.duration * 0.5,
      }, HERO_END + shrink.start + shrink.duration * 0.45)

      .fromTo(aboutSideLabel.value, { autoAlpha: 0, x: -160, yPercent: -44 }, {
        autoAlpha: 1,
        x: -160,
        yPercent: -50,
        duration: copyIn.duration,
      }, HERO_END + copyIn.start)
      .fromTo(aboutCopy.value, { autoAlpha: 0, x: 48 }, {
        autoAlpha: 1,
        x: 0,
        duration: copyIn.duration,
      }, HERO_END + copyIn.start)

    heroSettleAt = timeline.totalDuration() > 0 ? HERO_END / timeline.totalDuration() : 1
  }

  function buildMobile(): void {
    const { section, stage, card, clipPath, borderPath, border, labels } = els
    const { title, grid, smallPlaceholder, sidePlaceholder, annotation } = els

    if (
      !section.value || !stage.value || !card.value || !clipPath.value || !borderPath.value
      || !border.value || !labels.value || !title.value || !grid.value
      || !smallPlaceholder.value || !sidePlaceholder.value || !annotation.value
    ) return

    gsap.set([title.value, grid.value, smallPlaceholder.value, sidePlaceholder.value, annotation.value], {
      autoAlpha: 0,
    })
    gsap.set(border.value, { autoAlpha: 0 })
    clipPath.value.setAttribute('d', HERO_CLIP_INITIAL)
    borderPath.value.setAttribute('d', HERO_CLIP_INITIAL)

    const mobileCardRect = () => {
      const width = Math.min(window.innerWidth * 0.82, HERO_CARD.maxWidth)
      const height = Math.min(width * (HERO_CARD.height / HERO_CARD.maxWidth), window.innerHeight * 0.52)
      return {
        width,
        height,
        left: (window.innerWidth - width) / 2,
        top: window.innerHeight * 0.24,
      }
    }
    const syncMobileSectionHeight = (): void => {
      const aboutHeight = els.aboutCopy.value?.closest<HTMLElement>('.about-section')?.scrollHeight
        ?? window.innerHeight
      section.value?.style.setProperty('--mobile-about-height', `${aboutHeight}px`)
    }
    syncMobileSectionHeight()

    timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: () => {
          syncMobileSectionHeight()
          return `+=${Math.round(window.innerHeight * 1.05)}`
        },
        pin: stage.value,
        pinSpacing: false,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          heroSettled.value = self.progress >= 0.48
        },
      },
    })

    timeline
      .to(labels.value, {
        autoAlpha: 0,
        y: -42,
        duration: 0.16,
      }, 0)
      .fromTo(card.value, {
        width: '100%',
        height: '100svh',
        left: 0,
        top: 0,
      }, {
        width: () => mobileCardRect().width,
        height: () => mobileCardRect().height,
        left: () => mobileCardRect().left,
        top: () => mobileCardRect().top,
        duration: 0.58,
      }, 0)
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_FINAL },
        duration: 0.58,
      }, 0)
      .to(border.value, {
        autoAlpha: 1,
        duration: 0.2,
      }, 0.38)
      .fromTo(title.value, { y: 34 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.24,
      }, 0.18)
      .fromTo(grid.value, { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: 0.22,
      }, 0.22)
      .fromTo(smallPlaceholder.value, { x: -44 }, {
        autoAlpha: 1,
        x: 0,
        duration: 0.26,
      }, 0.38)
      .fromTo(sidePlaceholder.value, { x: 44 }, {
        autoAlpha: 1,
        x: 0,
        duration: 0.26,
      }, 0.42)
      .fromTo(annotation.value, { y: 16 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.18,
      }, 0.48)
  }

  function teardown(): void {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null
    els.section.value?.style.removeProperty('--mobile-about-height')

    syncRestingPath()

    els.cardShowSecond.value = false
    els.cardReveal.value = undefined

    for (const node of [
      els.card, els.labels, els.title, els.grid,
      els.smallPlaceholder, els.sidePlaceholder, els.annotation,
      els.border, els.aboutBg, els.aboutSideLabel, els.aboutCopy,
    ]) {
      if (node.value) {
        gsap.set(node.value, { clearProps: 'opacity,visibility,transform,width,height,top,left' })
      }
    }
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
      hooks.onDeactivate?.()
      heroSettled.value = false
      isStaticLayout.value = desktop && reducedMotion
      syncRestingPath()

      if (motionAllowed && desktop) {
        buildDesktop()
        hooks.onActivate?.()
      }
      else if (motionAllowed && mobile) {
        buildMobile()
      }
      else {
        heroSettled.value = true
      }

      ScrollTrigger.refresh()
      return () => {
        teardown()
        hooks.onDeactivate?.()
      }
    })
  })

  onBeforeUnmount(() => {
    media?.revert()
    media = null
    teardown()
  })

  return { isStaticLayout, heroSettled, restingCardPath, getProgress }
}
