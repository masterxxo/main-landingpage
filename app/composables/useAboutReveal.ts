import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Ref } from 'vue'
import { DESKTOP_MIN_WIDTH, MOTION_ALLOWED_QUERY, REDUCED_MOTION_QUERY } from '~/constants/media'
import { HERO_CLIP_FINAL, HERO_CLIP_INITIAL } from '~/constants/heroClipPaths'
import { MOBILE_HERO_PIN_SCREENS } from '~/constants/heroLayout'

interface AboutRevealElements {
  heroSection: Ref<HTMLElement | null>
  aboutSection: Ref<HTMLElement | null>
  image: Ref<HTMLImageElement | null>
  clipPath: Ref<SVGPathElement | null>
  index: Ref<HTMLElement | null>
  title: Ref<HTMLElement | null>
}

export function useAboutReveal(
  els: AboutRevealElements,
  active: Ref<boolean>,
): void {
  let media: gsap.MatchMedia | null = null
  let trigger: ScrollTrigger | null = null
  let timeline: gsap.core.Timeline | null = null

  function mobileImageSize() {
    const initialWidth = Math.min(window.innerWidth - 48, 392)
    const initialHeight = Math.min(initialWidth, window.innerHeight * 0.48)
    return {
      initialWidth,
      initialHeight,
      finalWidth: initialWidth * 0.82,
      finalHeight: initialHeight * (38 / 48),
    }
  }

  function teardown(): void {
    trigger?.kill()
    trigger = null
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null

    if (els.image.value) gsap.set(els.image.value, { clearProps: 'width,height,transform' })
    if (els.index.value) gsap.set(els.index.value, { clearProps: 'opacity,visibility,transform' })
    if (els.title.value) gsap.set(els.title.value, { clearProps: 'opacity,visibility,transform' })
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
        els.clipPath.value?.setAttribute('d', HERO_CLIP_FINAL)
        if (mobile && els.image.value) {
          gsap.set(els.image.value, {
            width: () => mobileImageSize().finalWidth,
            height: () => mobileImageSize().finalHeight,
          })
        }
      }
      else if (
        motionAllowed && mobile && els.aboutSection.value && els.image.value
        && els.clipPath.value && els.index.value && els.title.value
      ) {
        active.value = false
        els.clipPath.value.setAttribute('d', HERO_CLIP_INITIAL)
        gsap.set([els.index.value, els.title.value], { autoAlpha: 0 })

        timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: els.aboutSection.value,
            start: () => `top+=${Math.round(window.innerHeight * MOBILE_HERO_PIN_SCREENS)} 82%`,
            end: () => `top+=${Math.round(window.innerHeight * MOBILE_HERO_PIN_SCREENS)} 8%`,
            scrub: 0.65,
            invalidateOnRefresh: true,
            onUpdate: self => {
              active.value = self.progress >= 0.82
            },
          },
        })

        timeline
          .fromTo(els.image.value, {
            width: () => mobileImageSize().initialWidth,
            height: () => mobileImageSize().initialHeight,
          }, {
            width: () => mobileImageSize().finalWidth,
            height: () => mobileImageSize().finalHeight,
            duration: 0.58,
          }, 0)
          .to(els.clipPath.value, {
            attr: { d: HERO_CLIP_FINAL },
            duration: 0.58,
          }, 0)
          .fromTo(els.index.value, { x: -28 }, {
            autoAlpha: 1,
            x: 0,
            duration: 0.18,
          }, 0.58)
          .fromTo(els.title.value, { y: 42 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.24,
          }, 0.64)
      }
      else if (motionAllowed && desktop && els.heroSection.value) {
        trigger = ScrollTrigger.create({
          trigger: els.heroSection.value,
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
