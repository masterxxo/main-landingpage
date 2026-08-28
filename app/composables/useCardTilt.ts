import { gsap } from 'gsap'
import type { Ref } from 'vue'

interface CardTiltOptions {
  /** Element łapiący ruch wskaźnika (hitbox). */
  surface: Ref<HTMLElement | null>
  /** Element, który faktycznie się przechyla (rotationX / rotationY). */
  target: Ref<HTMLElement | null>
  /** Maksymalne wychylenie w stopniach. */
  maxDeg?: number
  /** Predykat — czy tilt ma teraz reagować (np. dopiero po zjeździe karty). */
  enabled?: () => boolean
}

/**
 * Przechył 3D elementu za wskaźnikiem, wygładzony przez `gsap.quickTo`.
 * `enable()` podpina nasłuch i tweeny, `disable()` sprząta — wołaj je zależnie
 * od tego, czy dana wersja układu w ogóle używa tiltu.
 */
export function useCardTilt(options: CardTiltOptions) {
  const { surface, target, maxDeg = 8, enabled = () => true } = options

  let rotateXTo: gsap.QuickToFunc | null = null
  let rotateYTo: gsap.QuickToFunc | null = null

  function onPointerMove(event: PointerEvent): void {
    if (!surface.value || !enabled()) return

    const rect = surface.value.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    rotateXTo?.(-y * maxDeg)
    rotateYTo?.(x * maxDeg)
  }

  function reset(): void {
    rotateXTo?.(0)
    rotateYTo?.(0)
  }

  function enable(): void {
    if (rotateXTo || !surface.value || !target.value) return

    rotateXTo = gsap.quickTo(target.value, 'rotationX', { duration: 0.45, ease: 'power3.out' })
    rotateYTo = gsap.quickTo(target.value, 'rotationY', { duration: 0.45, ease: 'power3.out' })
    surface.value.addEventListener('pointermove', onPointerMove)
    surface.value.addEventListener('pointerleave', reset)
  }

  function disable(): void {
    surface.value?.removeEventListener('pointermove', onPointerMove)
    surface.value?.removeEventListener('pointerleave', reset)
    rotateXTo?.tween.kill()
    rotateYTo?.tween.kill()
    rotateXTo = null
    rotateYTo = null
    if (target.value) gsap.set(target.value, { clearProps: 'rotationX,rotationY,transform' })
  }

  onBeforeUnmount(disable)

  return { enable, disable }
}
