import { gsap } from 'gsap'
import type { Ref } from 'vue'

interface CardTiltOptions {
  surface: Ref<HTMLElement | null>
  target: Ref<HTMLElement | null>
  maxRotationDegrees?: number
  enabled?: () => boolean
}

export function useCardTilt(options: CardTiltOptions) {
  const { surface, target, maxRotationDegrees = 8, enabled = () => true } = options

  let rotateXTo: gsap.QuickToFunc | null = null
  let rotateYTo: gsap.QuickToFunc | null = null

  function onPointerMove(event: PointerEvent): void {
    if (!surface.value || !enabled()) return

    const surfaceBounds = surface.value.getBoundingClientRect()
    const horizontalOffset = (event.clientX - surfaceBounds.left) / surfaceBounds.width - 0.5
    const verticalOffset = (event.clientY - surfaceBounds.top) / surfaceBounds.height - 0.5

    rotateXTo?.(-verticalOffset * maxRotationDegrees)
    rotateYTo?.(horizontalOffset * maxRotationDegrees)
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
